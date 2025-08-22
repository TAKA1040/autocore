'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function UnauthorizedContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 text-center bg-white rounded-lg shadow-md max-w-md">
        <h1 className="mb-4 text-2xl font-bold text-red-600">アクセス拒否</h1>
        <p className="mb-4">
          申し訳ございませんが、このアプリケーションは特定のユーザーのみがアクセスできます。
        </p>
        {email && (
          <p className="mb-4 text-sm text-gray-600">
            使用されたメールアドレス: <span className="font-mono">{email}</span>
          </p>
        )}
        <p className="mb-6 text-sm text-gray-500">
          アクセス許可が必要な場合は、管理者にお問い合わせください。
        </p>
        <Link 
          href="/login"
          className="inline-block px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          ログインページに戻る
        </Link>
      </div>
    </div>
  )
}

export default function UnauthorizedPage() {
  return (
    <Suspense>
      <UnauthorizedContent />
    </Suspense>
  )
}
