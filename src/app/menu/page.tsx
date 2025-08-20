
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from './LogoutButton'

export default async function MenuPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 text-center bg-white rounded-lg shadow-md">
        <h1 className="mb-4 text-2xl font-bold">Welcome!</h1>
        <p className="mb-4">You are logged in as: {data.user.email}</p>
        <button className="px-4 py-2 mx-2 font-bold text-white bg-green-500 rounded hover:bg-green-700">
          はじめに
        </button>
        <LogoutButton />
      </div>
    </div>
  )
}
