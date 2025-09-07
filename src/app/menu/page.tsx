'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { type User } from '@supabase/supabase-js'
import LogoutButton from './LogoutButton'
import Link from 'next/link'
import ToolButtons from './ToolButtons'
import type { Tool } from '@/types/tool'

// 型定義

interface RunningProcess {
  toolId: string;
  toolName: string;
  pid: number;
  port: number | null;
  startTime: string;
}

export default function MenuPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [tools, setTools] = useState<Tool[]>([])
  const [activeProcesses, setActiveProcesses] = useState<RunningProcess[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()
  const router = useRouter()

  // 起動中プロセスを取得する関数
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/running-status')
      if (res.ok) {
        const data = await res.json();
        setActiveProcesses(data)
      }
    } catch (error) {
      console.error("Failed to fetch running status:", error)
    }
  }

  // 停止ボタンの処理
  const handleStopTool = async (pid: number) => {
    try {
      await fetch('/api/stop-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid }),
      })
      // 即座にUIに反映させる
      await fetchStatus()
    } catch (error) {
      console.error("Failed to stop tool:", error)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      // ユーザー情報とプロファイルを取得
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('status, role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.status !== 'APPROVED') {
        router.push('/auth/status')
        return
      }
      setIsAdmin(profile.role === 'ADMIN')

      // ツール一覧を取得
      const { data: toolsData } = await supabase
        .from('tools')
        .select('*')
        .eq('enabled', true)
        .order('name')
      
      if (toolsData) {
        setTools(toolsData)
      }

      // 起動中プロセスを取得
      await fetchStatus()

      setLoading(false)
    }

    fetchData()

    // 5秒ごとに状態を自動更新
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval) // コンポーネントが消えるときに自動更新を停止
  }, [supabase, router])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-lg">
        <h1 className="mb-4 text-2xl font-bold text-center">Welcome!</h1>
        <p className="mb-6 text-center text-gray-600">ようこそ、{user?.email}</p>

        <div className="space-y-4">
          <div>
            <h2 className="text-left text-sm font-semibold text-gray-700 mb-2">登録ツール</h2>
            {tools && tools.length > 0 ? (
              <ToolButtons tools={tools} />
            ) : (
              <p className="text-sm text-gray-500">有効化されたツールがありません。管理者は「ツール設定」から追加・有効化できます。</p>
            )}
          </div>

          {/* 起動中ツールの一覧 */}
          <div>
            <h2 className="text-left text-sm font-semibold text-gray-700 mb-2">起動中のツール</h2>
            {activeProcesses.length > 0 ? (
              <ul className="space-y-2">
                {activeProcesses.map((proc) => (
                  <li key={proc.pid} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-bold text-gray-800">{proc.toolName}</p>
                      <p className="text-xs text-gray-500">
                        Port: {proc.port || 'N/A'} | PID: {proc.pid}
                      </p>
                    </div>
                    <button
                      onClick={() => handleStopTool(proc.pid)}
                      className="px-3 py-1 text-xs font-medium text-white bg-red-500 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      停止
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">現在起動中のツールはありません。</p>
            )}
          </div>

          {isAdmin && (
            <div className="space-y-2 border-t pt-4">
               <h2 className="text-left text-sm font-semibold text-gray-700 mb-2">管理者メニュー</h2>
              <Link
                href="/admin"
                className="block w-full px-4 py-2 text-center font-bold text-white bg-purple-500 rounded hover:bg-purple-700"
              >
                👑 管理ダッシュボード
              </Link>
              <Link
                href="/admin/settings"
                className="block w-full px-4 py-2 text-center font-bold text-white bg-indigo-500 rounded hover:bg-indigo-700"
              >
                🔧 ツール設定
              </Link>
            </div>
          )}

          <div className="border-t pt-4">
            <LogoutButton />
          </div>
        </div>

        {isAdmin && (
          <p className="mt-4 text-xs text-purple-600 text-center">あなたは管理者権限を持っています。</p>
        )}
      </div>
    </div>
  )
}