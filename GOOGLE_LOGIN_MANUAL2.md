# Google ログイン + 承認フロー 簡易導入マニュアル（Next.js 15 + Supabase）

この手順書は、最小構成で「Google ログイン → プロファイル作成 → 承認待ち → 管理者承認 → 利用開始」までを再現できるようにまとめたものです。最終版の仕上げやRLSの厳格化、通知連携などは本書の拡張セクションを参照してください。

---

## 1. 前提・バージョン
- Next.js: 15.5.0（App Router）
- React: 19.1.0
- Supabase: `@supabase/ssr` + `@supabase/supabase-js`
- ローカルポート: 3002（既定、変更可）

---

## 2. Supabase 側の準備
1) プロジェクト作成（既存でも可）
2) Authentication → Providers → Google を有効化
3) Redirect URLs に以下（開発）を登録
   - `http://localhost:3002/auth/callback`
   - 必要に応じて本番ドメインの `/auth/callback` も登録
4) `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を控える

---

## 3. Next.js 側の設定
### 3.1 環境変数（.env.local）
プロジェクト直下に `.env.local` を作成し、以下を設定（値は置き換え）：

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

保存後、開発サーバーを再起動すると確実です（HMRで拾える場合もあり）。

### 3.2 開発サーバー起動
- PowerShell（例）
```
$env:PORT=3002
npm run dev -- --port 3002
```
ポート競合（EADDRINUSE）の場合：
```
# 使用プロセスの確認
netstat -ano | findstr :3002
# 例: PID 48552 を強制終了
taskkill /PID 48552 /F
```

---

## 4. サーバー/クライアント分離の鉄則
- クライアント側: `src/lib/supabase/client.ts` → `createBrowserClient()` を使用
- サーバー側: `src/lib/supabase/server.ts` → `createServerClient()` を使用
  - Next.js 15 の `cookies()` は Promise を返すため、`await cookies()` してから同期的に `get/set/remove`
  - 本プロジェクトの `createClient()` は非同期関数です。呼び出し側は必ず `await createClient()` に統一
- Middleware/Edge: `src/lib/supabase/middleware.ts` を使用（`NextRequest/NextResponse`）

---

## 5. 直近の最小フロー（すぐ再現できる導線）
最小2点の編集だけで「承認待ち → 承認 → 利用開始」を再現できます。

### 5.1 既定ステータスを PENDING に
- ファイル: `src/lib/auth-config.ts`
- 変更: `AUTH_CONFIG.DEFAULT_USER_STATUS = 'PENDING'`
- 事前承認/管理者メールは `PRE_APPROVED_EMAILS` / `ADMIN_EMAILS` で制御

### 5.2 /menu に APPROVED ガードを追加
- ファイル: `src/app/menu/page.tsx`
- 追加ロジック（概念）：
  - `profiles` から `id = user.id` を取得
  - `status !== 'APPROVED'` なら `redirect('/auth/status')`

これで、未承認ユーザーが `/menu` に来ても必ず承認待ち画面へ送客されます。

---

## 6. /auth/status の役割（既存ロジックの要点）
- `profiles` 未作成なら作成
  - `id = user.id`, `email = user.email`, `status = DEFAULT_USER_STATUS`
  - 管理者または事前承認メールの場合は `APPROVED`（かつ `role = ADMIN/USER`）で作成
- `status === 'APPROVED'` なら `/menu` にリダイレクト
- それ以外（`PENDING`）は承認待ち画面を表示

---

## 7. 管理者承認の仕組み（段階追加）
現状は Supabase ダッシュボードで `profiles.status` を `APPROVED` に変更すれば流れが確認できます。運用に耐える形にするには次を追加：

- サーバーアクションまたは Route Handler を作成
  - 例: `src/app/admin/actions.ts`（`'use server'`）または `src/app/admin/approve/route.ts`（POST）
  - セッションからユーザーを取得→管理者判定→`profiles.status` を更新
- `/admin` UI に「承認」ボタンを追加
  - ボタン押下→サーバーアクション/Route 呼び出し→更新後に再読込

---

## 8. RLS（Row Level Security）ポリシーの指針
最終的に安全運用するには RLS を有効化して以下を満たすこと：
- 本人は自分の `profiles` を `select/insert` 可能（初回作成）
- `status/role` の更新は管理者のみ
- 管理者は `profiles` 全件を `select` 可能

本リポジトリの `supabase/migrations/` を参考に、必要ならマイグレーションを追加してください。

---

## 9. 付録（よくあるトラブル）
- 500（Internal Server Error）が出る
  - 開発サーバーのターミナルにスタックトレースが出るので確認
  - 環境変数（`NEXT_PUBLIC_SUPABASE_URL/ANON_KEY`）が未設定/誤りで失敗するケースが多い
- favicon で 500
  - `public/favicon.ico` から静的配信する（`src/app/icon.ico` は App Router 用）。ルーティング経由だとアプリのエラーの影響を受けがち
- ポート競合（EADDRINUSE）
  - `netstat -ano | findstr :3002` → `taskkill /PID <PID> /F`

---

## 10. 動作確認チェックリスト
1) 未承認ユーザーでログイン → `/auth/status` で「承認待ち」表示
2) 管理者が `profiles.status` を `APPROVED` に変更（暫定）
3) ユーザーが `/auth/status` を開くと `/menu` にリダイレクト
4) `/menu` に APPROVED ガードが効いている（未承認は `/auth/status` へ）

---

## 11. 今後の拡張
- 監査カラム追加（`approved_at`, `approved_by`）または `approvals` テーブル
- 承認時の通知（メール/Slack）
- `/admin` のUX改善（絞り込み、検索、ページングなど）
- README に本書の抜粋を追記（環境差分やデプロイ手順も）

---

以上。最小2点（PENDING化と `/menu` ガード）を加えれば、すぐに「ログイン→承認待ち→承認→利用開始」の流れが再現できます。最終完成時には本書の各セクションをベースに設定・コードを強化してください。

---

## 12. 完全再現レシピ（コピペでOKな詳細手順）

以下は、このリポジトリを取得した直後から「Google ログイン → 承認待ち → 承認 → 利用開始」までを確実に再現するための、具体的なコマンド・差分・SQL を含む手順です。

### 12.1 リポジトリ取得と起動準備
- 依存インストール（パッケージマネージャは任意）
```powershell
pnpm install
# or
npm install
```

- `.env.local` をプロジェクト直下に作成
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

- Supabase 側で Google Provider を有効化し、Redirect URL に開発用の以下を登録
```
http://localhost:3002/auth/callback
```

### 12.2 開発サーバー起動（3002）
```powershell
if (Test-Path .next) { Remove-Item -Recurse -Force .next }
$env:PORT=3002
pnpm dev --port 3002
# or
$env:PORT=3002
npm run dev -- --port 3002
```

- ポート競合時（EADDRINUSE）
```powershell
netstat -ano | findstr :3002
taskkill /PID <PID> /F
```

### 12.3 最小変更その1: 既定ステータスを PENDING に
- 対象: `src/lib/auth-config.ts`
- 変更箇所（抜粋）
```ts
export const AUTH_CONFIG = {
  // ...略...
  DEFAULT_USER_STATUS: 'PENDING' as const,
  DEFAULT_USER_ROLE: 'USER' as const,
  DEFAULT_ADMIN_ROLE: 'ADMIN' as const,
  // ...略...
}
```

### 12.4 最小変更その2: /menu に APPROVED ガードを追加
- 対象: `src/app/menu/page.tsx`
- 更新例（関数本体イメージ）
```tsx
export default async function MenuPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }

  // プロフィール取得
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle()

  if (!profileData || profileData.status !== 'APPROVED') {
    redirect('/auth/status')
  }

  // 以降は既存のUI
  // ...
}
```

### 12.5 Supabase: profiles テーブル作成（未作成の場合）
Supabase Dashboard の SQL Editor で実行：
```sql
-- profiles テーブル
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  status text not null check (status in ('PENDING','APPROVED')),
  role text not null check (role in ('USER','ADMIN')),
  created_at timestamptz default now(),
  approved_at timestamptz,
  approved_by uuid
);

alter table public.profiles enable row level security;
```

### 12.6 RLS ポリシー（最小運用例）
「本人の参照/作成可・管理者は全件参照/更新可」を満たす例です。管理者判定は「自分自身の profiles が ADMIN かどうか」で行います。

```sql
-- 本人は自分の行を参照可、または呼び出しユーザーが管理者なら全件参照可
create policy "profiles_select_self_or_admin" on public.profiles
for select
using (
  id = auth.uid() OR
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'ADMIN'
  )
);

-- 本人のみ自分の行を作成可（初回作成）
create policy "profiles_insert_self" on public.profiles
for insert
with check (id = auth.uid());

-- 管理者のみ更新可（任意のカラムを更新可能とする最小例）
create policy "profiles_update_admin" on public.profiles
for update
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'ADMIN'
  )
)
with check (true);
```

注意:
- 既に同等のポリシーがある場合は重複作成に注意（`drop policy if exists ...` を適宜利用）
- 本番では更新可能カラムを `status, role, approved_at, approved_by` などに限定することを推奨

### 12.7 事前承認/管理者メールの設定
- 対象: `src/lib/auth-config.ts`
- 例：
```ts
export const AUTH_CONFIG = {
  ADMIN_EMAILS: ['you-admin@example.com'],
  PRE_APPROVED_EMAILS: ['partner@example.com'],
  // ...
}
```

### 12.8 動作確認
1) ブラウザをシークレットウィンドウで開く／既存セッションは Logout
2) 事前承認に含まれないメールで Google ログイン
3) `/auth/status` に遷移し「承認待ち」が表示される（`profiles` に PENDING で行が作成）
4) 管理者が Supabase ダッシュボードで該当ユーザーの `profiles.status` を `APPROVED` に更新（暫定の手動運用）
5) ユーザーが `/auth/status` を開くと `/menu` へリダイレクトされ、利用可能になる

### 12.9 よくあるトラブルと対処
- 500（Internal Server Error）
  - 開発サーバーのターミナルにエラーが出ます。アクセス直後の赤いスタックトレース全文を確認
  - 環境変数の未設定/誤り（`NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY`）が主因のことが多い
- favicon で 500
  - `public/favicon.ico` に設置し、静的配信させる
- ポート競合
  - `netstat -ano | findstr :3002` → `taskkill /PID <PID> /F`

### 12.10 仕上げに向けた次の一手
- 承認ボタンのサーバーアクション/Route Handler 実装（`/admin` UI から approve/reject）
- 監査カラム（`approved_at`, `approved_by`）の運用と表示
- RLS の厳格化（更新可能カラムの限定、権限の細分化）

