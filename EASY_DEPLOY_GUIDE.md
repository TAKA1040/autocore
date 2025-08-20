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

*このガイドにより、どのAIツールからでも **1～2コマンド** でプッシュ&デプロイが可能になります。*