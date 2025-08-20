'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client' // serverではなくclientをインポート

export default function Page() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        router.push('/menu')
      } else {
        router.push('/login')
      }
    }
    checkUser()
  }, [router, supabase])

  return <div>Loading...</div> // ローディング表示
}
