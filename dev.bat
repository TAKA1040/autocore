@echo off
REM ===========================================
REM autocore - ローカル開発環境起動
REM ===========================================
REM 使用方法: dev.bat [PORT]

echo 🚀 autocore - ローカル開発を開始...

set PORT=3000
if not "%~1"=="" set PORT=%~1

echo 🌐 ポート: %PORT%
echo 📁 プロジェクト: autocore

REM 依存関係チェック
if not exist "node_modules" (
    echo 📦 node_modules が見つかりません。npm install を実行...
    npm install
    if errorlevel 1 (
        echo ❌ npm install に失敗しました
        pause
        exit /b 1
    )
    echo ✅ 依存関係のインストール完了
) else (
    echo ✅ node_modules が存在します
)

REM 環境設定チェック
if exist ".env.local" (
    echo ✅ .env.local 設定済み
) else if exist ".env" (
    echo ✅ .env 設定済み
) else (
    echo ⚠️ 環境設定ファイルが見つかりません
    REM Supabaseプロジェクトの場合の警告
    if exist "lib\supabaseClient.ts" (
        echo ❌ .env.local が必要です！
        echo 💡 以下の設定を追加してください:
        echo    NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
        echo    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
        pause
    ) else (
        echo 💡 必要に応じて .env.local を作成してください
    )
)

REM package.jsonから技術スタックを判定
for /f "tokens=*" %%i in ('type package.json ^| findstr "\"dev\""') do set DEV_SCRIPT=%%i

if "%DEV_SCRIPT:vite=%" NEQ "%DEV_SCRIPT%" (
    echo ⚡ Vite開発サーバーを起動中...
    echo 📝 技術スタック: Vite + React
) else if "%DEV_SCRIPT:next=%" NEQ "%DEV_SCRIPT%" (
    echo ⚡ Next.js開発サーバーを起動中...
    echo 📝 技術スタック: Next.js + React
) else (
    echo ⚡ 開発サーバーを起動中...
)

echo 🌐 ブラウザで http://localhost:%PORT% にアクセス
echo ⏹️ 停止するには Ctrl+C

npm run dev -- --port %PORT%

if errorlevel 1 (
    echo ❌ 開発サーバー起動に失敗
    echo 💡 トラブルシューティング:
    echo    1. ポート %PORT% の使用状況確認
    echo    2. 環境変数設定確認  
    echo    3. npm install 再実行
    pause
    exit /b 1
)

echo ✅ 開発サーバーが終了しました
pause