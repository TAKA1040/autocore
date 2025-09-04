// 認証設定（メール直書きは廃止）
export const AUTH_CONFIG = {
  // 既定ロール/ステータス
  DEFAULT_USER_STATUS: 'PENDING' as const,
  DEFAULT_USER_ROLE: 'USER' as const,
  DEFAULT_ADMIN_ROLE: 'ADMIN' as const,

  // リダイレクト設定
  REDIRECTS: {
    AFTER_LOGIN: '/menu',
    AFTER_LOGOUT: '/login',
    UNAUTHORIZED: '/auth/unauthorized',
    AUTH_ERROR: '/auth/auth-code-error',
    PENDING_APPROVAL: '/auth/pending-approval',
  },
}

// 事前承認メール: 環境変数 PRE_APPROVED_EMAILS（CSV）から判定（サーバ専用）
export const isPreApprovedEmailFromEnv = (
  email: string | null | undefined,
): boolean => {
  if (!email) return false
  const csv = (process.env.PRE_APPROVED_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return csv.includes(email.toLowerCase())
}

// 初期ロールは既定ユーザーロール。管理者付与はDB（profiles.role）で行う。
export const getUserRole = (
  _email: string | null | undefined,
): 'ADMIN' | 'USER' => {
  return AUTH_CONFIG.DEFAULT_USER_ROLE
}

