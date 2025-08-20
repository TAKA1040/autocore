# 🚀 Next.js (App Router) で Supabase Google ログインを実装する完全ガイド

このマニュアルは、Next.js プロジェクトに Supabase を利用した Google ログイン機能を簡単に追加するための手順書です。

---

## 🎯 最終的なゴール

- ユーザーが「Googleでログイン」ボタンをクリックすると、Googleの認証ページにリダイレクトされる。
- 認証後、アプリケーションにコールバックされ、自動的にログイン状態になる。
- ログイン後は、指定されたページ（例：メニューページ）にリダイレクトされる。

---

## ⚙️ 1. 前提条件

### ライブラリ

以下のライブラリがインストールされている必要があります。`package.json` を確認してください。

```json
{
  "dependencies": {
    "@supabase/auth-helpers-nextjs": "^0.10.0",
    "@supabase/ssr": "^0.6.1",
    "@supabase/supabase-js": "^2.55.0",
    "next": "15.5.0",
    "react": "19.1.0",
    "react-dom": "19.1.0"
  }
}
```

### 環境変数

プロジェクトのルートに `.env.local` ファイルを作成し、Supabase プロジェクトの URL と Anon Key を設定します。

```.env
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

> **重要**: これらの値は、Supabase プロジェクトの管理画面（Settings > API）で確認できます。

---

## 🗺️ 2. 実装の全体像

Googleログインは以下の流れで処理されます。

1.  **ログインページ (`/login`)**: ユーザーが「Googleでログイン」ボタンをクリック。
2.  **Supabase へリダイレクト**: `supabase.auth.signInWithOAuth` が実行され、Googleの認証ページへ移動。
3.  **Google 認証**: ユーザーがGoogleアカウントでログイン。
4.  **コールバック (`/auth/callback`)**: Googleからアプリケーションにリダイレクトされ、認証コードが渡される。
5.  **セッション生成**: `/auth/callback` ルートハンドラが認証コードをセッションに交換し、クッキーに保存。
6.  **ミドルウェア (`middleware.ts`)**: すべてのリクエストでセッションを検証・更新。
7.  **ログイン完了**: ユーザーはログイン状態になり、目的のページ（例：`/menu`）へリダイレクトされる。

---

## 🛠️ 3. ステップ別実装ガイド

### Step 1: Supabase クライアントの準備

まず、クライアントサイドとサーバーサイドで Supabase と通信するためのクライアントを作成します。

#### クライアントサイド用 (`src/lib/supabase/client.ts`)

ブラウザ環境（Reactコンポーネントなど）で使用します。

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### サーバーサイド用 (`src/lib/supabase/server.ts`)

サーバー環境（ルートハンドラ、サーバーコンポーネント）で使用します。クッキーの読み書きを伴います。

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // サーバーコンポーネントからの呼び出し時に発生するエラーは無視できる
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // サーバーコンポーネントからの呼び出し時に発生するエラーは無視できる
          }
        },
      },
    }
  )
}
```

### Step 2: ログインページの作成

ユーザーがログイン操作を行うためのUIを作成します。

**ファイル:** `src/app/login/page.tsx`

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)

  // ログイン状態をチェックし、ログイン済みならリダイレクト
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        setUser(data.user)
        router.push('/menu')
      }
    }
    checkUser()
  }, [router, supabase.auth])

  // Googleログインボタンのクリック処理
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // 認証後のリダイレクト先
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
  }

  if (user) {
    return <div>Redirecting...</div>
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <h1 className="mb-4 text-2xl font-bold text-center">Login</h1>
        <button
          onClick={handleGoogleLogin}
          className="w-full px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
        >
          Login with Google
        </button>
      </div>
    </div>
  )
}
```

### Step 3: 認証コールバックの実装

Google認証後にリダイレクトされ、セッション情報を生成するためのルートハンドラを作成します。

**ファイル:** `src/app/auth/callback/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    // 認証コードをセッションに交換
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // 成功したら指定されたページ（またはトップ）にリダイレクト
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // エラーが発生した場合はエラーページにリダイレクト
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
```

### Step 4: ミドルウェアの設定

最後に、ユーザーのセッションをリクエスト間で維持・更新するためのミドルウェアを設定します。これにより、サーバーコンポーネントでも認証状態を正しく取得できます。

**ファイル:** `src/middleware.ts`

```typescript
import { createClient } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request)

  // セッションを最新の状態に更新
  await supabase.auth.getSession()

  return response
}

export const config = {
  matcher: [
    /*
     * 静的ファイルや画像最適化ファイルなどを除くすべてのパスでミドルウェアを実行
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

> **注意**: `src/lib/supabase/middleware.ts` の実装も必要です。通常は Supabase の公式ドキュメントにあるコードをそのまま使用します。

---

## ✅ まとめ

お疲れ様でした！以上のステップで、あなたの Next.js アプリケーションに Google ログイン機能が実装されているはずです。

- **重要なファイル**: `client.ts`, `server.ts`, `login/page.tsx`, `auth/callback/route.ts`, `middleware.ts`
- **重要な流れ**: ログイン開始 → Google認証 → コールバック → セッション生成 → 完了

このマニュアルを参考に、ぜひご自身のプロジェクトにも導入してみてください。
