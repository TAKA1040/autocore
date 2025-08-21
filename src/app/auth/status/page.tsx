import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/app/menu/LogoutButton' // 既存のログアウトボタンを再利用
import { AUTH_CONFIG, isPreApprovedEmail, getUserRole } from '@/lib/auth-config'

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
    // プロファイルが見つからない場合、新規作成を試みる
    console.error('Error fetching profile:', error)
    console.log('User ID:', user.id)
    console.log('User email:', user.email)
    console.log('Profile data:', profileData)
    
    // 事前承認済みメールアドレスかチェック
    if (!isPreApprovedEmail(user.email)) {
      // 許可されていないメールアドレスの場合
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
          <div className="p-8 text-center bg-white rounded-lg shadow-md">
            <h1 className="mb-4 text-2xl font-bold text-red-600">アクセス拒否</h1>
            <p className="mb-4">このアプリケーションは特定のユーザーのみがアクセスできます。</p>
            <p className="mb-4 text-sm text-gray-600">メールアドレス: {user.email}</p>
            <LogoutButton />
          </div>
        </div>
      )
    }

    // 許可されたメールアドレスの場合、プロファイル作成を試行
    try {
      console.log('Attempting to create profile for:', user.email, 'with ID:', user.id)
      
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id, // user.idは既にUUID形式のはず
            email: user.email,
            status: AUTH_CONFIG.DEFAULT_USER_STATUS,
            role: getUserRole(user.email)
          }
        ])
        .select()
        .maybeSingle() // single()の代わりにmaybeSingle()を使用

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

      // 作成成功 - メニューページへリダイレクト
      redirect(AUTH_CONFIG.REDIRECTS.AFTER_LOGIN)
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

  if (profile.status === 'APPROVED') {
    // 承認済みならメニューページへ
    redirect(AUTH_CONFIG.REDIRECTS.AFTER_LOGIN)
  }

  // 承認待ちの場合
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
