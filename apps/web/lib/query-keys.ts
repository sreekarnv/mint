export const queryKeys = {
  wallet: {
    root: () => ['wallet'] as const,
    history: () => ['wallet', 'history'] as const,
  },
  transactions: {
    list: () => ['transactions', 'list'] as const,
    listInfinite: () => ['transactions', 'list', 'infinite'] as const,
    detail: (id: string) => ['transactions', id] as const,
  },
  analytics: {
    insights: () => ['analytics', 'insights'] as const,
    topMerchants: () => ['analytics', 'top-merchants'] as const,
    summary: () => ['analytics', 'summary'] as const,
    budgets: () => ['analytics', 'budgets'] as const,
  },
  notifications: {
    list: () => ['notifications'] as const,
    unreadCount: () => ['notifications', 'unread-count'] as const,
  },
  social: {
    contacts: () => ['social', 'contacts'] as const,
    requests: (status?: string) =>
      ['social', 'requests', status ?? 'all'] as const,
    splits: () => ['social', 'splits'] as const,
    split: (id: string) => ['social', 'splits', id] as const,
  },
  kyc: {
    profile: () => ['kyc', 'profile'] as const,
    limits: () => ['kyc', 'limits'] as const,
  },
  admin: {
    userSearch: (email: string) => ['admin', 'users', 'search', email] as const,
    user: (userId: string) => ['admin', 'users', userId] as const,
    kycProfile: (userId: string) => ['admin', 'kyc', 'user', userId] as const,
    kycQueue: () => ['admin', 'kyc', 'queue'] as const,
    fraudQueue: () => ['admin', 'fraud', 'queue'] as const,
    transactionsList: (params: Record<string, string | undefined>) =>
      ['admin', 'transactions', 'list', params] as const,
    auditLog: (params: Record<string, string | undefined>) =>
      ['admin', 'audit', params] as const,
    systemLimits: () => ['admin', 'system', 'limits'] as const,
  },
};
