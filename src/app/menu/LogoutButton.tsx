'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { AUTH_CONFIG } from '@/lib/auth-config'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push(AUTH_CONFIG.REDIRECTS.AFTER_LOGOUT)
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 mx-2 font-bold text-white bg-red-500 rounded hover:bg-red-700"
    >
      Logout
    </button>
  )
}
