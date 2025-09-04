'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type User } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/app/menu/LogoutButton'

// Type definitions
interface Tool {
  id: string
  name: string
  command: string
  port: number | null
  enabled: boolean
}

interface AllowedPath {
  id: string
  path: string
}

export default function AdminSettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [tools, setTools] = useState<Tool[]>([])
  const [allowedPaths, setAllowedPaths] = useState<AllowedPath[]>([])
  const [loading, setLoading] = useState(true)
  
  // Tool Form state
  const [toolName, setToolName] = useState('')
  const [toolCommand, setToolCommand] = useState('')
  const [toolPort, setToolPort] = useState('')
  const [editingToolId, setEditingToolId] = useState<string | null>(null)
  // Simple mode (beginner-friendly)
  const [simpleMode, setSimpleMode] = useState(true)
  const [simpleCwd, setSimpleCwd] = useState('')
  const [simpleRunner, setSimpleRunner] = useState<'npm' | 'pnpm' | 'bun'>('npm')
  const [simpleTemplate, setSimpleTemplate] = useState<'auto' | 'next' | 'vite' | 'generic'>('auto')
  const [openInWindowsTerminal, setOpenInWindowsTerminal] = useState(true)
  // Path Form state
  const [newPath, setNewPath] = useState('')

  const supabase = createClient()

  const fetchAllData = async () => {
    const { data: toolsData, error: toolsError } = await supabase
      .from('tools')
      .select('*')
      .order('created_at', { ascending: false })

    if (toolsError) console.error('Error fetching tools:', toolsError)
    else if (toolsData) setTools(toolsData)

    const { data: pathsData, error: pathsError } = await supabase
      .from('allowed_paths')
      .select('*')
      .order('created_at', { ascending: false })

    if (pathsError) console.error('Error fetching allowed paths:', pathsError)
    else if (pathsData) setAllowedPaths(pathsData)
  }

  useEffect(() => {
    const checkUserAndFetch = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) redirect('/login')
      setUser(user)
      await fetchAllData()
      setLoading(false)
    }
    checkUserAndFetch()
  }, [supabase])

  const resetToolForm = () => {
    setToolName('')
    setToolCommand('')
    setToolPort('')
    setEditingToolId(null)
    setSimpleMode(true)
    setSimpleCwd('')
    setSimpleRunner('npm')
    setSimpleTemplate('auto')
    setOpenInWindowsTerminal(true)
  }

  const buildSimpleCommand = (
    cwd: string,
    runner: 'npm'|'pnpm'|'bun',
    port?: string | number,
    template: 'auto' | 'next' | 'vite' | 'generic' = 'auto',
    useWindowsTerminal: boolean = false,
  ) => {
    const runnerCmdBase = runner === 'npm' ? 'npm run dev' : runner === 'pnpm' ? 'pnpm dev' : 'bun dev'
    const portStr = (typeof port === 'number' ? String(port) : (port || '').trim())

    // テンプレートごとのポート指定
    let cmdInside = runnerCmdBase
    if (portStr) {
      if (template === 'auto') {
        // auto: Next/Vite どちらでも通る --port を使用
        cmdInside += ` -- --port ${portStr}`
      } else if (template === 'next') {
        // Next.js も --port を受け付ける（長い形式）。混乱回避のため統一。
        cmdInside += ` -- --port ${portStr}`
      } else if (template === 'vite') {
        cmdInside += ` -- --port ${portStr}`
      } else {
        // generic: PORT 環境変数で渡す（対応していない場合は無視される）
        cmdInside = `set PORT=${portStr} && ${cmdInside}`
      }
    }

    if (useWindowsTerminal) {
      // 最終使用の Windows Terminal ウィンドウ(-w last)に新規タブ(nt)で開く（無い場合は新規）
      return `wt -w last nt -d "${cwd}" cmd /k "${cmdInside}"`
    }
    // 既定: 新しい cmd を起動して CWD に移動してから実行
    return `cmd /c start "" cmd /k "cd /d \"${cwd}\" && ${cmdInside}"`
  }

  const handleToolSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!toolName) {
      alert('ツール名は必須です。')
      return
    }
    const cmdTrimmed = toolCommand.trim()
    // 簡単モード: 入力有無に関わらずこちらを優先して自動生成（WTタブ起動やテンプレのポート付与を反映）
    let finalCommand = cmdTrimmed
    if (simpleMode) {
      if (!simpleCwd) {
        alert('簡単モードでは作業フォルダ(CWD)が必要です。')
        return
      }
      if (allowedPaths.length > 0) {
        const ok = allowedPaths.some(p => simpleCwd.startsWith(p.path))
        if (!ok) {
          alert('CWD が許可されたフォルダパスのいずれかで始まっていません。先に右のフォームからパスを許可してください。')
          return
        }
      }
      if (!toolPort) {
        alert('簡単モードではポート番号が必須です（ブラウザ自動オープンに使用します）。')
        return
      }
      finalCommand = buildSimpleCommand(simpleCwd, simpleRunner, toolPort, simpleTemplate, openInWindowsTerminal)
    }
    // コマンド未入力（簡単モードで自動生成もしない）ならポート必須
    if (!finalCommand && !toolPort) {
      alert('コマンド未入力の場合はポート番号が必要です。')
      return
    }
    // 任意モード（simpleMode=false）でコマンドを直接入力した場合のみ、許可パス検証を行う
    if (!simpleMode && cmdTrimmed && allowedPaths.length > 0) {
      // 可能ならばコマンド中から CWD を抽出して検証する
      // 例: wt -w last nt -d "C:\path" ... /  または  cmd /c start "" cmd /k "cd /d \"C:\path\" && ..."
      let extractedPath = ''
      const m1 = cmdTrimmed.match(/-d\s+"([^"]+)"/)
      const m2 = cmdTrimmed.match(/cd\s+\/d\s+"([^"]+)"/i)
      const m3 = cmdTrimmed.match(/cd\s+\/d\s+([^&\"]+)/i)
      const m4 = cmdTrimmed.match(/cd\s+"([^"]+)"/i)
      const m5 = cmdTrimmed.match(/cd\s+([^&\"]+)/i)
      if (m1) extractedPath = m1[1]
      else if (m2) extractedPath = m2[1]
      else if (m3) extractedPath = m3[1].trim()
      else if (m4) extractedPath = m4[1]
      else if (m5) extractedPath = m5[1].trim()

      const subject = extractedPath || cmdTrimmed
      const isValidPath = allowedPaths.some(p => subject.startsWith(p.path))
      if (!isValidPath) {
        alert('コマンドのパスが、許可されたフォルダパスのいずれかで始まっていません。先に右のフォームからパスを許可してください。')
        return
      }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('認証されていません。ログインし直してください。')
      return
    }

    const toolData = { name: toolName, command: finalCommand || toolCommand, port: toolPort ? parseInt(toolPort, 10) : null, user_id: user.id }
    const { error } = editingToolId
      ? await supabase.from('tools').update(toolData).eq('id', editingToolId)
      : await supabase.from('tools').insert([toolData])

    if (error) {
      console.error('Error saving tool:', error)
      alert(`エラーが発生しました: ${error.message}`)
    } else {
      resetToolForm()
      await fetchAllData()
    }
  }

  const handleDeleteTool = async (toolId: string) => {
    if (!window.confirm('このツールを本当に削除しますか？')) return
    const { error } = await supabase.from('tools').delete().eq('id', toolId)
    if (error) alert(`エラーが発生しました: ${error.message}`)
    else await fetchAllData()
  }

  const handleEditClick = (tool: Tool) => {
    setEditingToolId(tool.id)
    setToolName(tool.name)
    setToolCommand(tool.command)
    setToolPort(tool.port ? String(tool.port) : '')

    // 既存ツールの編集時は簡単モードをONにして、適切な初期値を設定
    setSimpleMode(true)

    // 既存のコマンドから作業フォルダを推測（wt コマンドの場合）
    let extractedPath = ''
    if (tool.command && tool.command.includes('-d "')) {
      const match = tool.command.match(/-d "([^"]+)"/)
      if (match) extractedPath = match[1]
    }
    setSimpleCwd(extractedPath || 'C:\\Windsurf\\PromptFusion')

    // 既存のコマンドからランナーを推測
    let extractedRunner: 'npm' | 'pnpm' | 'bun' = 'npm'
    if (tool.command && tool.command.includes('pnpm')) extractedRunner = 'pnpm'
    else if (tool.command && tool.command.includes('bun')) extractedRunner = 'bun'
    setSimpleRunner(extractedRunner)

    // 既存のコマンドからテンプレートを推測
    let extractedTemplate: 'auto' | 'next' | 'vite' | 'generic' = 'auto'
    if (tool.command && tool.command.includes('set PORT=')) extractedTemplate = 'generic'
    else if (tool.command && tool.command.includes('-- --port')) extractedTemplate = 'auto'
    setSimpleTemplate(extractedTemplate)

    // Windows Terminal使用の判定
    const usesWT = !!(tool.command && tool.command.includes('wt '))
    setOpenInWindowsTerminal(usesWT)
  }

  const handlePathSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPath) return
    const { error } = await supabase.from('allowed_paths').insert([{ path: newPath }])
    if (error) alert(`エラーが発生しました: ${error.message}`)
    else {
      setNewPath('')
      await fetchAllData()
    }
  }

  const handleDeletePath = async (pathId: string) => {
    if (!window.confirm('この許可パスを本当に削除しますか？')) return
    const { error } = await supabase.from('allowed_paths').delete().eq('id', pathId)
    if (error) alert(`エラーが発生しました: ${error.message}`)
    else await fetchAllData()
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🛠️ ツール設定</h1>
              <p className="text-sm text-gray-600">起動するツールとポート、許可パスを設定します。</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/menu" className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium">メニューに戻る</Link>
              <Link href="/admin" className="px-4 py-2 text-gray-600 hover:text-blue-800 font-medium">ダッシュボード</Link>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Tool Management */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">{editingToolId ? 'ツールを編集' : '新しいツールを追加'}</h2>
            <form onSubmit={handleToolSubmit} className="space-y-4">
              <div>
                <label htmlFor="tool-name" className="block text-sm font-medium text-gray-700">ツール名</label>
                <input id="tool-name" type="text" value={toolName} onChange={(e) => setToolName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="My Awesome Tool" />
              </div>
              {/* Simple mode toggle & fields */}
              <div className="flex items-center space-x-2">
                <input id="simple-mode" type="checkbox" checked={simpleMode} onChange={(e) => setSimpleMode(e.target.checked)} />
                <label htmlFor="simple-mode" className="text-sm text-gray-700">かんたん起動モード（コマンドを自動作成）</label>
              </div>
              {simpleMode && (
                <div className="space-y-3 p-3 border rounded-md bg-gray-50">
                  <div>
                    <label htmlFor="simple-cwd" className="block text-sm font-medium text-gray-700">作業フォルダ (CWD)</label>
                    <input id="simple-cwd" type="text" value={simpleCwd} onChange={(e) => setSimpleCwd(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="C:\Windsurf\MyApp" />
                  </div>
                  <div>
                    <label htmlFor="simple-runner" className="block text-sm font-medium text-gray-700">起動方法</label>
                    <select id="simple-runner" value={simpleRunner} onChange={(e) => setSimpleRunner(e.target.value as 'npm' | 'pnpm' | 'bun')} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                      <option value="npm">npm run dev</option>
                      <option value="pnpm">pnpm dev</option>
                      <option value="bun">bun dev</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="simple-template" className="block text-sm font-medium text-gray-700">テンプレート</label>
                    <select id="simple-template" value={simpleTemplate} onChange={(e) => setSimpleTemplate(e.target.value as 'auto' | 'next' | 'vite' | 'generic')} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                      <option value="auto">自動（-- --port PORT）[推奨]</option>
                      <option value="next">Next.js（-- --port PORT）</option>
                      <option value="vite">Vite（-- --port PORT）</option>
                      <option value="generic">汎用（PORT 環境変数）</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input id="open-wt" type="checkbox" checked={openInWindowsTerminal} onChange={(e) => setOpenInWindowsTerminal(e.target.checked)} />
                    <label htmlFor="open-wt" className="text-sm text-gray-700">Windows Terminal のタブで開く（wt -w last nt）</label>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">保存時、未入力のコマンド欄に次のコマンドを自動挿入します：</p>
                    <code className="block bg-white text-gray-800 px-2 py-1 rounded-md text-xs mt-1">{buildSimpleCommand(simpleCwd || 'C:\\path\\to\\app', simpleRunner, toolPort, simpleTemplate, openInWindowsTerminal)}</code>
                  </div>
                </div>
              )}
              <div>
                <label htmlFor="tool-command" className="block text-sm font-medium text-gray-700">実行コマンド（未入力なら上の設定で自動作成）</label>
                <input id="tool-command" type="text" value={toolCommand} onChange={(e) => setToolCommand(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="C:\\path\\to\\tool.exe または 任意のコマンド" />
              </div>
              <div>
                <label htmlFor="tool-port" className="block text-sm font-medium text-gray-700">ポート番号 (コマンド未入力時は必須・自動オープンに使用)</label>
                <input id="tool-port" type="number" value={toolPort} onChange={(e) => setToolPort(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="8080" />
              </div>
              <div className="flex space-x-4">
                <button type="submit" className="flex-1 justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">{editingToolId ? '更新する' : '追加する'}</button>
                {editingToolId && (<button type="button" onClick={resetToolForm} className="flex-1 justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">キャンセル</button>)}
              </div>
            </form>
          </div>
          <div className="bg-white p-8 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">登録済みツール一覧</h2>
            {tools.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {tools.map((tool) => (
                  <li key={tool.id} className="py-4 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-lg text-gray-800">{tool.name}</p>
                      <p className="text-sm text-gray-500 mt-1">Command: <code className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs">{tool.command}</code></p>
                      {tool.port && <p className="text-sm text-gray-500">Port: <span className="font-semibold">{tool.port}</span></p>}
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => handleEditClick(tool)} className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200">編集</button>
                      <button onClick={() => handleDeleteTool(tool.id)} className="px-4 py-2 text-sm font-medium text-red-600 bg-red-100 rounded-lg hover:bg-red-200">削除</button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">登録されているツールはありません。</p>
            )}
          </div>
        </div>

        {/* Right Column: Path Management */}
        <div className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">許可するフォルダパスを追加</h2>
          <form onSubmit={handlePathSubmit} className="space-y-4">
            <div>
              <label htmlFor="path-input" className="block text-sm font-medium text-gray-700">フォルダパス</label>
              <input id="path-input" type="text" value={newPath} onChange={(e) => setNewPath(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="C:\Users\YourUser\Documents\MyTools\" />
            </div>
            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">パスを追加</button>
          </form>
          <div className="mt-8">
            <h3 className="text-lg font-bold mb-4">許可済みフォルダパス一覧</h3>
            {allowedPaths.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {allowedPaths.map((path) => (
                  <li key={path.id} className="py-3 flex justify-between items-center">
                    <code className="text-sm text-gray-700 break-all">{path.path}</code>
                    <button onClick={() => handleDeletePath(path.id)} className="ml-4 px-3 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-lg hover:bg-red-200">削除</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">許可されたパスはありません。</p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
