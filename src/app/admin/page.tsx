// server-only removed (no-op in runtime, not required)
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/auth-config'
import LogoutButton from '@/app/menu/LogoutButton'
import AdminDashboard from './AdminDashboard'

interface PendingUser {
  id: string
  email: string
  display_name: string | null
  login_attempts: number
  first_attempt_at: string
  last_attempt_at: string
  created_at: string
}

interface ApprovedUser {
  id: string
  email: string
  status: string
  role: string
  created_at: string
}

export default async function AdminPage() {
  const supabase = await createClient()

  // 現在のユーザーを取得
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  // プロフィールのロールを取得
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .maybeSingle()

  // 管理者権限チェック（DBロール or ハードコード管理者）
  const isAdmin = (profile?.role === 'ADMIN') || isAdminEmail(user.email)
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 text-center bg-white rounded-lg shadow-md">
          <h1 className="mb-4 text-2xl font-bold text-red-600">アクセス拒否</h1>
          <p className="mb-4">この管理ページにはアクセス権限がありません。</p>
          <LogoutButton />
        </div>
      </div>
    )
  }

  // 承認待ちユーザーを取得
  const { data: pendingUsers, error: pendingError } = await supabase
    .from('pending_users')
    .select('*')
    .order('first_attempt_at', { ascending: false })

  // 承認済みユーザーを取得（status=APPROVED のみ）
  const { data: approvedUsers, error: approvedError } = await supabase
    .from('profiles')
    .select('*')
    .eq('status', 'APPROVED')
    .order('created_at', { ascending: false })

  if (pendingError || approvedError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 text-center bg-white rounded-lg shadow-md">
          <h1 className="mb-4 text-2xl font-bold text-red-600">データ取得エラー</h1>
          <p className="mb-4">
            承認待ちユーザー: {pendingError?.message || '正常'}<br/>
            承認済みユーザー: {approvedError?.message || '正常'}
          </p>
          <LogoutButton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">👑 管理者ダッシュボード</h1>
              <p className="text-sm text-gray-600">ようこそ、{user.email}</p>
            </div>
            <div className="flex items-center space-x-4">
              <a 
                href="/menu" 
                className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                メニューに戻る
              </a>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminDashboard 
          pendingUsers={pendingUsers as PendingUser[] || []} 
          approvedUsers={approvedUsers as ApprovedUser[] || []}
        />
      </div>
    </div>
  )
}