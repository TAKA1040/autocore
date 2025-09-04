import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { AUTH_CONFIG, isPreApprovedEmailFromEnv } from '../../../lib/auth-config'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  console.log('🚀 Callback route called')
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  console.log('Code:', code ? 'Present' : 'Missing')
  console.log('Origin:', origin)

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    console.log('Exchange code error:', error)
    if (!error) {
      // 認証成功後、ユーザー情報を取得してメールアドレスをチェック
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user && user.email) {
        console.log('Callback - User authenticated:', user.email, 'ID:', user.id)
        console.log('Callback - Pre-approved check:', isPreApprovedEmailFromEnv(user.email))
        
        // 事前承認でなくてもログイン状態を維持して /auth/status へ誘導
        if (!isPreApprovedEmailFromEnv(user.email)) {
          console.log('Callback - Not pre-approved, recording to pending_users (audit)')
          try {
            const { error: pendingError } = await supabase
              .from('pending_users')
              .insert([
                {
                  id: user.id,
                  email: user.email,
                  display_name: user.user_metadata?.full_name || user.email,
                  login_attempts: 1,
                  last_attempt_at: new Date().toISOString()
                }
              ])

            if (pendingError && pendingError.code !== '23505') {
              console.log('Error inserting pending user:', pendingError)
            }
          } catch (err) {
            console.log('Error recording pending user:', err)
          }
        }
        return NextResponse.redirect(`${origin}/auth/status`)
      }
    }
  }

  // return the user to an error page with instructions
  console.log('❌ Redirecting to auth error page')
  return NextResponse.redirect(`${origin}${AUTH_CONFIG.REDIRECTS.AUTH_ERROR}`)
}
