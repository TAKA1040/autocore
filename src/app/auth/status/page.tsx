// server-only removed (no-op in runtime, not required)
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/app/menu/LogoutButton' // 既存のログアウトボタンを再利用
import { AUTH_CONFIG, getUserRole } from '@/lib/auth-config'

interface UserProfile {
  id: string;
  email: string;
  status: 'PENDING' | 'APPROVED';
  role: 'USER' | 'ADMIN';
  created_at: string;
}

export default async function StatusPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // 念のため、未ログイン状態ならログインページへ
    return redirect('/login')
  }

  // profilesテーブルから直接ユーザーのステータスを取得
  const { data: profileData, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)

  // プロファイルが存在するかチェック
  const profile = profileData && profileData.length > 0 ? profileData[0] as UserProfile : null

  if (error || !profile) {
    // プロファイルが見つからない場合、ステータスPENDINGで作成（すべてのログインユーザー対象）
    console.error('Error fetching profile or profile missing:', error)
    try {
      console.log('Attempting to create profile for:', user.email, 'with ID:', user.id)
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            email: user.email,
            status: AUTH_CONFIG.DEFAULT_USER_STATUS,
            role: getUserRole(user.email)
          }
        ])
        .select()
        .maybeSingle()
      console.log('Insert result:', { newProfile, insertError })
      if (insertError) {
        console.error('Error creating profile:', insertError)
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 text-center bg-white rounded-lg shadow-md">
              <h1 className="mb-4 text-2xl font-bold text-red-600">プロファイル作成エラー</h1>
              <p className="mb-4">ユーザープロファイルの作成に失敗しました。管理者にお問い合わせください。</p>
              <p className="mb-4 text-xs text-gray-500">Error: {insertError.message}</p>
              <LogoutButton />
            </div>
          </div>
        )
      }
      // 作成後は承認待ちの表示をそのまま行う
    } catch (insertErr) {
      console.error('Exception creating profile:', insertErr)
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
          <div className="p-8 text-center bg-white rounded-lg shadow-md">
            <h1 className="mb-4 text-2xl font-bold text-red-600">システムエラー</h1>
            <p className="mb-4">プロファイル作成中にシステムエラーが発生しました。</p>
            <LogoutButton />
          </div>
        </div>
      )
    }
  }

  if (profile?.status === 'APPROVED') {
    // 承認済みならメニューページへ
    redirect(AUTH_CONFIG.REDIRECTS.AFTER_LOGIN)
  }

  // 承認待ちの場合
  // pending_users にも記録（コールバックを経由しないケース対策）。
  // すでに存在する場合（UNIQUE違反）は無視する。
  try {
    const { error: pendErr } = await supabase
      .from('pending_users')
      .insert([
        {
          id: user.id,
          email: user.email!,
          display_name: user.user_metadata?.full_name || user.email!,
          login_attempts: 1,
          last_attempt_at: new Date().toISOString(),
        }
      ])
    if (pendErr && pendErr.code !== '23505') {
      console.error('Failed to record pending user on status page:', pendErr)
    }
  } catch (e) {
    console.error('Failed to record pending user on status page (exception):', e)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 text-center bg-white rounded-lg shadow-md">
        <h1 className="mb-4 text-2xl font-bold">承認をお待ちください</h1>
        <p className="mb-4">現在、管理者の承認待ちです。承認されると、サービスをご利用いただけます。</p>
        <p className="mb-2 text-sm text-gray-600">ようこそ, {user.email}</p>
        <LogoutButton />
      </div>
    </div>
  )
}
