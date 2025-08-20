
'use client'

import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

// GoogleアイコンのSVGコンポーネント
const GoogleIcon = () => (
  <svg className="w-6 h-6 mr-3" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.802 9.92C34.553 6.182 29.632 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
    <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039L38.802 9.92C34.553 6.182 29.632 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 36.417 44 30.638 44 24c0-1.341-.138-2.65-.389-3.917z" />
  </svg>
)

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        setUser(data.user)
        router.push('/menu') // ログイン済みならメニューへ
      }
    }
    checkUser()
  }, [router, supabase.auth])

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
  }

  if (user) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
            <p>Redirecting to application...</p>
        </div>
    ) // リダイレクト中の表示
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 bg-opacity-50 rounded-2xl shadow-2xl backdrop-blur-lg">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Welcome Back</h1>
          <p className="mt-2 text-gray-400">Sign in to continue to AutoCore</p>
        </div>
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center px-6 py-3 text-lg font-semibold text-gray-800 bg-white rounded-lg shadow-md hover:bg-gray-200 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-gray-900"
        >
          <GoogleIcon />
          <span>Sign in with Google</span>
        </button>
        <p className="text-xs text-center text-gray-500">
          By signing in, you agree to our Terms of Service.
        </p>
      </div>
    </main>
  )
}
