'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function PendingApprovalContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 text-center bg-white rounded-lg shadow-md max-w-md">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
        
        <h1 className="mb-4 text-2xl font-bold text-yellow-600">承認をお待ちください</h1>
        
        <p className="mb-4">
          あなたのログイン申請を管理者が確認中です。承認されるまでしばらくお待ちください。
        </p>
        
        {email && (
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">申請メールアドレス:</p>
            <p className="font-mono text-sm font-semibold">{email}</p>
          </div>
        )}
        
        <div className="mb-6 text-sm text-gray-500">
          <p>管理者による承認後、こちらのメールアドレスでログインが可能になります。</p>
          <p className="mt-2">承認通知は行われませんので、時間をおいて再度ログインをお試しください。</p>
        </div>
        
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

export default function PendingApprovalPage() {
  return (
    <Suspense>
      <PendingApprovalContent />
    </Suspense>
  )
}
