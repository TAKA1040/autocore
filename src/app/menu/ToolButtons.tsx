'use client'

import { useState } from 'react'

interface Tool {
  id: string
  name: string
  port?: number
  launch_url?: string
}

interface ToolButtonsProps {
  tools: Tool[]
}

export default function ToolButtons({ tools }: ToolButtonsProps) {
  const [loadingTool, setLoadingTool] = useState<string | null>(null)

  const handleLaunchTool = async (toolId: string) => {
    setLoadingTool(toolId)
    try {
      const response = await fetch('/api/launch-tool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tool_id: toolId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'API request failed')
      }

      // 成功時は通知を出さず、邪魔しない
      console.info(result.message || `Launched: ${result.tool_name || result.command || ''}`)
    } catch (error) {
      console.error('Failed to launch tool:', error)
      alert(`起動に失敗しました: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoadingTool(null)
    }
  }

  const handleOpenUrl = async (tool: Tool) => {
    const url = (tool.launch_url && tool.launch_url.trim()) || (tool.port ? `http://localhost:${tool.port}` : '')
    if (!url) {
      alert('このツールには URL/ポートの情報がありません。管理画面で設定してください。')
      return
    }
    try {
      // ブラウザ自動オープンをAPI側で抑止して、UI側で遅延オープン
      await fetch('/api/launch-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_id: tool.id, suppress_open: true }),
      })
    } catch (e) {
      console.error('起動API呼び出しに失敗しました:', e)
      // API失敗でもフォールバックとして開くかは要件次第。ここでは開かない。
    }
    // 少し待ってからURLを開く（既定: 3秒）
    setTimeout(() => {
      window.open(url, '_blank')
    }, 3000)
  }

  return (
    <div className="space-y-3">
      {tools.map(tool => (
        <div key={tool.id} className="flex gap-2">
          <button
            onClick={() => handleLaunchTool(tool.id)}
            disabled={loadingTool === tool.id}
            className="flex-1 px-4 py-2 font-bold text-white bg-sky-500 rounded hover:bg-sky-700 transition-colors disabled:bg-sky-300 disabled:cursor-not-allowed"
          >
            {loadingTool === tool.id ? 'Launching...' : `🚀 ${tool.name}`}
          </button>
          {(tool.launch_url || tool.port) && (
            <button
              onClick={() => handleOpenUrl(tool)}
              className="px-3 py-2 text-white bg-green-500 rounded hover:bg-green-700 transition-colors"
              title={`${tool.launch_url || (tool.port ? `http://localhost:${tool.port}` : '')} を開く（起動→3秒後）`}
            >
              🌐
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
