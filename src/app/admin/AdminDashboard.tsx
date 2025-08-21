'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getUserRole } from '@/lib/auth-config'

interface PendingUser {
  id: string
  email: string
  display_name: string | null
  login_attempts: number
  first_attempt_at: string
  last_attempt_at: string
  created_at: string
}

interface ApprovedUser {
  id: string
  email: string
  status: string
  role: string
  created_at: string
}

interface AdminDashboardProps {
  pendingUsers: PendingUser[]
  approvedUsers: ApprovedUser[]
}

export default function AdminDashboard({ pendingUsers: initialPending, approvedUsers: initialApproved }: AdminDashboardProps) {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>(initialPending)
  const [approvedUsers, setApprovedUsers] = useState<ApprovedUser[]>(initialApproved)
  const [approving, setApproving] = useState<Set<string>>(new Set())
  const supabase = createClient()

  const handleApprove = async (pendingUser: PendingUser) => {
    if (approving.has(pendingUser.id)) return
    
    setApproving(prev => new Set(prev).add(pendingUser.id))
    
    try {
      // 1. profilesテーブルに追加
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            id: pendingUser.id,
            email: pendingUser.email,
            status: 'APPROVED',
            role: getUserRole(pendingUser.email)
          }
        ])

      if (insertError) {
        console.error('Error creating profile:', insertError)
        alert(`承認エラー: ${insertError.message}`)
        return
      }

      // 2. pending_usersから削除
      const { error: deleteError } = await supabase
        .from('pending_users')
        .delete()
        .eq('id', pendingUser.id)

      if (deleteError) {
        console.error('Error deleting pending user:', deleteError)
        // profilesからも削除（ロールバック）
        await supabase.from('profiles').delete().eq('id', pendingUser.id)
        alert(`削除エラー: ${deleteError.message}`)
        return
      }

      // 3. UIを更新
      setPendingUsers(prev => prev.filter(user => user.id !== pendingUser.id))
      setApprovedUsers(prev => [...prev, {
        id: pendingUser.id,
        email: pendingUser.email,
        status: 'APPROVED',
        role: getUserRole(pendingUser.email),
        created_at: new Date().toISOString()
      }])

      alert(`${pendingUser.email} を承認しました！`)

    } catch (error) {
      console.error('Approval error:', error)
      alert('承認処理中にエラーが発生しました')
    } finally {
      setApproving(prev => {
        const newSet = new Set(prev)
        newSet.delete(pendingUser.id)
        return newSet
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-8">
      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">承認待ち</h3>
              <p className="text-2xl font-bold text-yellow-600">{pendingUsers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">承認済み</h3>
              <p className="text-2xl font-bold text-green-600">{approvedUsers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">総ユーザー数</h3>
              <p className="text-2xl font-bold text-blue-600">{pendingUsers.length + approvedUsers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 承認待ちリスト */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">⏳ 承認待ちユーザー</h2>
          <p className="text-sm text-gray-600">ログインを試行したユーザーの一覧です</p>
        </div>
        
        {pendingUsers.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            承認待ちのユーザーはいません
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ユーザー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    試行回数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    初回試行
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最終試行
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-yellow-800">
                              {user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.email}</div>
                          {user.display_name && user.display_name !== user.email && (
                            <div className="text-sm text-gray-500">{user.display_name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {user.login_attempts} 回
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.first_attempt_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.last_attempt_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleApprove(user)}
                        disabled={approving.has(user.id)}
                        className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white ${
                          approving.has(user.id)
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                        }`}
                      >
                        {approving.has(user.id) ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            承認中...
                          </>
                        ) : (
                          '✓ 承認する'
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 承認済みリスト */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">✅ 承認済みユーザー</h2>
          <p className="text-sm text-gray-600">現在ログイン可能なユーザーの一覧です</p>
        </div>
        
        {approvedUsers.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            承認済みのユーザーはいません
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ユーザー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    権限
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    承認日時
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {approvedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className={`h-10 w-10 rounded-full ${user.role === 'ADMIN' ? 'bg-purple-100' : 'bg-green-100'} flex items-center justify-center`}>
                            <span className={`text-sm font-medium ${user.role === 'ADMIN' ? 'text-purple-800' : 'text-green-800'}`}>
                              {user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'ADMIN' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'ADMIN' ? '👑 管理者' : '👤 ユーザー'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}