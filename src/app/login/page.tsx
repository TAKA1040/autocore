
'use client'

import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

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
    return <div>Redirecting to menu...</div> // リダイレクト中の表示
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <h1 className="mb-4 text-2xl font-bold text-center">Login</h1>
        <button
          onClick={handleGoogleLogin}
          className="w-full px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
        >
          Login with Google
        </button>
      </div>
    </div>
  )
}
