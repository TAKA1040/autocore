// 認証設定ファイル
export const AUTH_CONFIG = {
  // 管理者メールアドレス（自動承認される）
  ADMIN_EMAILS: [
    'dash201206@gmail.com'
  ],
  
  // 事前承認済みメールアドレス（自動承認される）
  PRE_APPROVED_EMAILS: [
    'startdash.z@gmail.com',
    'dash201206@gmail.com'
  ],
  
  // デフォルトユーザー設定
  DEFAULT_USER_STATUS: 'PENDING' as const,
  DEFAULT_USER_ROLE: 'USER' as const,
  DEFAULT_ADMIN_ROLE: 'ADMIN' as const,
  
  // リダイレクト設定
  REDIRECTS: {
    AFTER_LOGIN: '/menu',
    AFTER_LOGOUT: '/login',
    UNAUTHORIZED: '/auth/unauthorized',
    AUTH_ERROR: '/auth/auth-code-error',
    PENDING_APPROVAL: '/auth/pending-approval'
  }
}

// ヘルパー関数
export const isPreApprovedEmail = (email: string | null | undefined): boolean => {
  if (!email) return false
  return AUTH_CONFIG.PRE_APPROVED_EMAILS.includes(email)
}

export const isAdminEmail = (email: string | null | undefined): boolean => {
  if (!email) return false
  return AUTH_CONFIG.ADMIN_EMAILS.includes(email)
}

export const getUserRole = (email: string | null | undefined): 'ADMIN' | 'USER' => {
  if (isAdminEmail(email)) return AUTH_CONFIG.DEFAULT_ADMIN_ROLE
  return AUTH_CONFIG.DEFAULT_USER_ROLE
}