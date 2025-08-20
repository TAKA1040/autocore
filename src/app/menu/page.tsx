
'use client'

import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function MenuPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        setUser(data.user)
      } else {
        router.push('/login') // 未ログインならログインページへ
      }
    }
    checkUser()
  }, [router, supabase.auth])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) {
    return <div>Loading...</div> // ユーザー情報取得中の表示
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 text-center bg-white rounded-lg shadow-md">
        <h1 className="mb-4 text-2xl font-bold">Welcome!</h1>
        <p className="mb-4">You are logged in as: {user.email}</p>
        <button className="px-4 py-2 mx-2 font-bold text-white bg-green-500 rounded hover:bg-green-700">
          はじめに
        </button>
        <button
          onClick={handleLogout}
          className="px-4 py-2 mx-2 font-bold text-white bg-red-500 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
