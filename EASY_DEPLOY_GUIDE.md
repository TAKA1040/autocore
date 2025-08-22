# 🚀 超簡単デプロイガイド - 全AIツール対応

## 🎯 目的：ジェミニー・Windsurf・Claude Codeでも簡単にプッシュ&デプロイ

---

## 📋 **即実行可能な方法 4つ**

### **方法1: npm run 系（推奨）**
```bash
# プロジェクト内で実行
npm run commit-deploy              # コミット → プッシュ → デプロイ
npm run deploy                     # ビルド → デプロイ  
npm run deploy:quick               # 即座にデプロイ
```

### **方法2: 専用batファイル（Windows）**
```bash
# プロジェクト内で実行
deploy.bat                         # デフォルトメッセージでデプロイ
deploy.bat "feat: 新機能追加"       # カスタムメッセージでデプロイ
```

### **方法3: グローバルコマンド**
```bash
# どこからでも実行可能
deploy nenpi                       # nenpiプロジェクトをデプロイ
deploy nenpi "fix: バグ修正"       # メッセージ指定でデプロイ
deploy                             # 現在ディレクトリをデプロイ
```

### **方法4: PowerShell直接実行**
```powershell
# フルパス指定で実行
C:\Windsurf\scripts\simple-deploy.ps1 "C:\Windsurf\nenpi" "feat: 改善"
```

---

## 🎪 **AIツール別の使い方**

### **🤖 Gemini CLI**
```bash
# 以下のコマンドをそのままコピペして実行:
cd C:\Windsurf\nenpi
npm run commit-deploy
```

### **🏄‍♀️ Windsurf**  
```bash
# ターミナルで以下を実行:
npm run commit-deploy
# または
deploy.bat
```

**⚠️ Windsurf特有の問題と対処法:**
- **権限エラー**: Git操作でアクセス拒否される場合
- **ターミナル競合**: Windsurf内ターミナルでコマンド失敗する場合
- **パス問題**: 相対パスが解決されない場合

### **🎭 Claude Code**
既存の複雑なルールも使用可能、または上記の簡単な方法も利用可能

---

## 🔍 **トラブルシューティング**

### **エラー1: "npm run not found"**
```bash
# 解決策: batファイルを使用
deploy.bat
```

### **エラー2: "PowerShell実行ポリシー"**
```powershell
# 解決策: 一時的に許可
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
C:\Windsurf\scripts\simple-deploy.ps1
```

### **エラー3: "vercel not found"**
```bash
# 解決策: Vercel CLI をインストール
npm i -g vercel
vercel login
```

### **🏄‍♀️ Windsurf固有の問題**

#### **問題A: Git Push権限エラー**
```bash
# Windsurfのターミナルで権限エラーが出る場合
# 解決策1: Windows PowerShellを直接使用
# スタートメニュー → PowerShell → 管理者として実行
cd C:\Windsurf\autocore
git add . && git commit -m "feat: 機能追加" && git push

# 解決策2: GitHub Desktop使用
# GitHub Desktop → Changes → Commit → Push
```

#### **問題B: ターミナルコマンド実行失敗**
```bash
# Windsurfの統合ターミナルでコマンド失敗する場合
# 解決策1: 外部ターミナル使用
# Windows Terminal または PowerShell を別途起動

# 解決策2: VSCode Terminal使用（もしインストール済みなら）
# VSCode → Terminal → New Terminal

# 解決策3: Claude Codeに依頼
# Claude Codeはターミナル統合が優秀なため、デプロイ作業を依頼
```

#### **問題C: パス解決エラー**
```bash
# 相対パスが解決されない場合
# ❌ 失敗例
npm run commit-deploy

# ✅ 解決策: 絶対パス指定
cd C:\Windsurf\autocore
npm run commit-deploy

# または環境変数使用
cd %USERPROFILE%\Windsurf\autocore
npm run commit-deploy
```

#### **問題D: Node.js/npm認識されない**
```bash
# Windsurfでnpmコマンドが見つからない場合
# 解決策1: フルパス指定
C:\Program Files\nodejs\npm.exe run commit-deploy

# 解決策2: 環境変数確認
echo $env:PATH  # PowerShell
echo %PATH%     # Command Prompt

# 解決策3: Node.js再インストール
# https://nodejs.org/ から最新版をダウンロード・インストール
```

### **🚨 Windsurf使用時の推奨ワークフロー**

```bash
# 1. 確実な方法（推奨）
# Windows PowerShellを管理者として起動
cd C:\Windsurf\autocore
git status
git add .
git commit -m "feat: 新機能追加 🤖 Generated with Windsurf"
git push origin main

# 2. 代替方法
# GitHub Desktopアプリを使用
# - Changes タブで変更を確認
# - Commit メッセージを入力
# - "Commit to main" をクリック
# - "Push origin" をクリック

# 3. Claude Codeに依頼
# 「プッシュ＆デプロイして」とClaude Codeに依頼
# Claude Codeは git + vercel 操作が得意
```

---

## 📁 **対応プロジェクト**
- ✅ **nenpi** (燃費計算ツール)
- ✅ **mimamori-calendar2** (見守りカレンダー)  
- ✅ **hikaku** (比較システム)
- ✅ **voiceCast** (音声配信)
- ✅ **autocore** (自動化システム)

---

## 🌟 **推奨ワークフロー**

### **開発中（頻繁にテスト）**
```bash
npm run deploy:quick    # 高速デプロイ
```

### **機能完了時**
```bash
npm run commit-deploy   # コミット込みで完全デプロイ
```

### **緊急修正時**
```bash
deploy.bat "hotfix: 緊急修正"
```

---

## 🎯 **成功の目安**
- ✅ コマンドが正常終了
- ✅ デプロイURLが表示される
- ✅ ブラウザで動作確認OK

**失敗時は:** Claude Codeに相談して詳細診断を実行

---

## 🌐 本番URLが更新されない時のチェックリスト（Vercel）

1. **.vercel.app 直アクセスで差分確認**  
   例: `https://<project>.vercel.app/menu`（日本語の「ようこそ、{email}」が出れば最新デプロイOK）

2. **Production エイリアス確認（最新デプロイに紐付いているか）**  
   Vercel → Project → Deployments → 最新の Production を開く → Aliases にカスタムドメインがあるか。  
   ない場合は「Assign domain」または「Promote to Production」で現在のデプロイへ割当て。

3. **Domains 設定（DNS）**  
   Vercel → Project → Settings → Domains で `autocore-eapaf.me` が Ready か確認。  
   - Apex(@): A `76.76.21.21`  
   - www: CNAME `cname.vercel-dns.com`  
   他サービスを向いていると旧画面が出続けます。

4. **キャッシュ回避**  
   `https://autocore-eapaf.me/menu?v=ts<適当な数値>` のようにクエリ付きで再読み込み。

5. **環境変数**  
   Vercel の Project → Settings → Environment Variables で  
   `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` が設定済みか確認。

6. **ワンコマンド再デプロイ**  
   ガイド先頭のスクリプトで再トリガー可能:
   ```bash
   npm run commit-deploy   # 変更をコミットして main に push（Vercel 自動デプロイ）
   ```

---

*このガイドにより、どのAIツールからでも **1～2コマンド** でプッシュ&デプロイが可能になります。*