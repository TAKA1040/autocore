'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
// 管理者判定のメール直書きは廃止（デバッグ画面では表示のみ）
import { User } from '@supabase/supabase-js'

export default function DebugPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getUser()
        
        if (error) {
          setError(`Auth error: ${error.message}`)
        } else if (data.user) {
          setUser(data.user)
        } else {
          setError('No user found')
        }
      } catch (err) {
        setError(`Exception: ${err}`)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [supabase.auth])

  const handleGoogleLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${location.origin}/auth/callback`,
        },
      })
    } catch (err) {
      setError(`Login error: ${err}`)
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">🔍 Debug Page</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">認証状況</h2>
          {error && (
            <div className="text-red-600 mb-2">❌ {error}</div>
          )}
          
          {user ? (
            <div className="text-green-600">
              <div>✅ ログイン済み: {user.email}</div>
              <div>🆔 User ID: {user.id}</div>
              {/* Admin情報の判定は削除（必要なら別途APIで取得） */}
              <div>👑 Admin: (hidden)</div>
            </div>
          ) : (
            <div className="text-red-600">❌ 未ログイン</div>
          )}
        </div>

        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">Actions</h2>
          {!user && (
            <button
              onClick={handleGoogleLogin}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Google Login
            </button>
          )}
          
          {user && (
            <div className="space-x-2">
              <a
                href="/menu"
                className="inline-block px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Go to Menu
              </a>
              {/* 管理者リンクの条件表示は削除 */}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
