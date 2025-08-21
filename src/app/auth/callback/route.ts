import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { AUTH_CONFIG, isPreApprovedEmail } from '../../../lib/auth-config'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // 認証成功後、ユーザー情報を取得してメールアドレスをチェック
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user && user.email) {
        console.log('Callback - User authenticated:', user.email, 'ID:', user.id)
        console.log('Callback - Pre-approved check:', isPreApprovedEmail(user.email))
        
        // 事前承認済みメールアドレスかチェック
        if (isPreApprovedEmail(user.email)) {
          console.log('Callback - Pre-approved email, redirecting to /auth/status')
          return NextResponse.redirect(`${origin}/auth/status`)
        } else {
          console.log('Callback - Not pre-approved, adding to pending users')
          
          // 未承認ユーザーをpending_usersテーブルに記録
          try {
            const { error: pendingError } = await supabase
              .from('pending_users')
              .upsert({
                id: user.id,
                email: user.email,
                display_name: user.user_metadata?.full_name || user.email,
                login_attempts: 1,
                last_attempt_at: new Date().toISOString()
              }, {
                onConflict: 'email',
                // 既存の場合はlogin_attemptsを増加させる
              })

            if (!pendingError) {
              // login_attemptsを増加させる
              await supabase
                .from('pending_users')
                .update({
                  login_attempts: supabase.raw('login_attempts + 1'),
                  last_attempt_at: new Date().toISOString()
                })
                .eq('email', user.email)
            }
          } catch (err) {
            console.log('Error recording pending user:', err)
          }

          // ログアウトして承認待ちページへ
          await supabase.auth.signOut()
          return NextResponse.redirect(`${origin}${AUTH_CONFIG.REDIRECTS.PENDING_APPROVAL}?email=${encodeURIComponent(user.email)}`)
        }
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}${AUTH_CONFIG.REDIRECTS.AUTH_ERROR}`)
}
