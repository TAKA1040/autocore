import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from './LogoutButton'
import Link from 'next/link'
import ToolButtons from './ToolButtons'

export default async function MenuPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }

  // プロフィール（ステータス/ロール）を取得
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('status, role')
    .eq('id', data.user.id)
    .maybeSingle()

  if (profileError || !profile || profile.status !== 'APPROVED') {
    redirect('/auth/status')
  }

  // 管理者判定はDBロールのみ
  const isAdmin = profile?.role === 'ADMIN'

  // 登録ツールを取得
  const { data: tools, error: toolsError } = await supabase
    .from('tools')
    .select('*')
    .eq('enabled', true)
    .order('name')

  if (toolsError) {
    console.error('Error fetching tools:', toolsError)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 text-center bg-white rounded-lg shadow-md max-w-md">
        <h1 className="mb-4 text-2xl font-bold">Welcome!</h1>
        <p className="mb-6">ようこそ、{data.user.email}</p>

        <div className="space-y-3">
          <h2 className="text-left text-sm font-semibold text-gray-700">登録ツール</h2>
          {tools && tools.length > 0 ? (
            <ToolButtons tools={tools} />
          ) : (
            <p className="text-sm text-gray-500">有効化されたツールがありません。管理者は「ツール設定」から追加・有効化できます。</p>
          )}

          

          {isAdmin && (
            <div className="space-y-2">
              <Link
                href="/admin"
                className="block w-full px-4 py-2 font-bold text-white bg-purple-500 rounded hover:bg-purple-700"
              >
                👑 管理ダッシュボード
              </Link>
              <Link
                href="/admin/settings"
                className="block w-full px-4 py-2 font-bold text-white bg-indigo-500 rounded hover:bg-indigo-700"
              >
                🔧 ツール設定
              </Link>
            </div>
          )}

          <LogoutButton />
        </div>

        {isAdmin && (
          <p className="mt-4 text-xs text-purple-600">あなたは管理者権限を持っています。</p>
        )}
      </div>
    </div>
  )
}