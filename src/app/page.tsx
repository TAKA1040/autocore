import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // ログイン済みは常にステータスページへ。承認済みならそこでメニューへ遷移。
    redirect('/auth/status')
  }
  // 未ログインはログインページへ
  redirect('/login')
}
