import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/app/menu/LogoutButton' // 既存のログアウトボタンを再利用

export default async function StatusPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // 念のため、未ログイン状態ならログインページへ
    return redirect('/login')
  }

  // profilesテーブルからユーザーのステータスをRPC関数で取得
  const { data: profile, error } = await supabase
    .rpc('get_user_profile_by_id', { user_id_in: user.id }) // RPC関数を呼び出す
    .single() // single() を使うことで、結果が1件であることを期待

  if (error || !profile) {
    // プロファイルが見つからない場合のエラーハンドリング
    // (トリガーが機能していれば通常は起こらない)
    console.error('Error fetching profile:', error)
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 text-center bg-white rounded-lg shadow-md">
                <h1 className="mb-4 text-2xl font-bold text-red-600">認証エラー</h1>
                <p className="mb-4">ユーザー情報の取得に失敗しました。アカウントがまだ有効化されていない可能性があります。管理者にお問い合わせください。</p>
                <p className="mb-4 text-xs text-gray-500">Error: {error?.message || 'Profile not found.'}</p>
                <LogoutButton />
            </div>
        </div>
    )
  }

  if (profile.status === 'APPROVED') {
    // 承認済みならメニューページへ
    redirect('/menu')
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
