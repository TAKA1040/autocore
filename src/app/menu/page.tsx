
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/auth-config'
import LogoutButton from './LogoutButton'
import Link from 'next/link'

export default async function MenuPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }

  const isAdmin = isAdminEmail(data.user.email)

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 text-center bg-white rounded-lg shadow-md max-w-md">
        <h1 className="mb-4 text-2xl font-bold">Welcome!</h1>
        <p className="mb-6">ようこそ、{data.user.email}</p>
        
        <div className="space-y-3">
          <button className="w-full px-4 py-2 font-bold text-white bg-green-500 rounded hover:bg-green-700">
            はじめに
          </button>
          
          {isAdmin && (
            <Link 
              href="/admin"
              className="block w-full px-4 py-2 font-bold text-white bg-purple-500 rounded hover:bg-purple-700"
            >
              👑 管理者ダッシュボード
            </Link>
          )}
          
          <LogoutButton />
        </div>
        
        {isAdmin && (
          <p className="mt-4 text-xs text-purple-600">
            あなたは管理者権限を持っています
          </p>
        )}
      </div>
    </div>
  )
}
