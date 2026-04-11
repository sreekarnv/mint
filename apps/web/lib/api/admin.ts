import { apiClient } from './client';

export interface UserSearchResult {
  id: string;
  email: string;
  name: string | null;
}

export interface AdminUserProfile {
  userId: string;
  email: string | null;
  name: string | null;
  role?: string;
  wallet: {
    id: string;
    balance: number;
    currency: string;
    status: string;
  };
  kyc: {
    tier: string;
    isFrozen: boolean;
  };
}

export interface AdminKycDocument {
  id: string;
  type: string;
  status: string;
  uploadedAt: string;
  docName: string;
}

export interface AdminKycProfile {
  profileId: string;
  tier: string;
  status: string;
  isFrozen: boolean;
  submittedAt: string;
  rejectionReason: string;
  documents: AdminKycDocument[];
}

export interface KycQueueItem {
  profileId: string;
  userId: string;
  tier: string;
  submittedAt: string;
}

export interface FraudQueueItem {
  caseId: string;
  transactionId: string;
  userId: string;
  score: number;
  rulesFired: string[];
  createdAt: string;
}

export interface AdminTransaction {
  id: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  description: string | null;
  senderId: string;
  recipientId: string | null;
  fraudDecision: string | null;
  fraudScore: number | null;
  createdAt: string;
  completedAt: string | null;
}

export interface AuditLogEntry {
  id: string;
  eventId: string;
  actorId: string;
  service: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  afterState: Record<string, unknown>;
  createdAt: string;
}

export interface SystemLimits {
  maxTransferCents: number;
  maxTopupCents: number;
  dailyLimitCents: number;
  monthlyLimitCents: number;
  currency: string;
}

export const adminApi = {
  user: {
    search: (email: string) =>
      apiClient.get<UserSearchResult[]>(
        `/api/v1/auth/users/search?email=${encodeURIComponent(email)}`,
      ),
    list: (email?: string) =>
      apiClient.get<UserSearchResult[]>(
        `/admin/users${email ? `?email=${encodeURIComponent(email)}` : ''}`,
      ),
    get: (userId: string) =>
      apiClient.get<AdminUserProfile>(`/admin/users/${userId}`),
    freeze: (userId: string, body: { reason: string }) =>
      apiClient.post(`/admin/users/${userId}/freeze`, body),
    unfreeze: (userId: string) =>
      apiClient.post(`/admin/users/${userId}/unfreeze`),
    updateRole: (userId: string, role: 'USER' | 'ADMIN') =>
      apiClient.patch(`/admin/users/${userId}/role`, { role }),
  },

  kyc: {
    listQueue: () =>
      apiClient.get<{ items: KycQueueItem[]; total: number }>('/admin/kyc/queue'),
    getByUserId: (userId: string) =>
      apiClient.get<AdminKycProfile>(`/admin/kyc/user/${userId}`),
    approve: (profileId: string) =>
      apiClient.post(`/admin/kyc/${profileId}/approve`),
    reject: (profileId: string, body: { reason: string }) =>
      apiClient.post(`/admin/kyc/${profileId}/reject`, body),
  },

  transactions: {
    list: (params?: { limit?: number; cursor?: string; userId?: string; status?: string }) => {
      const qs = new URLSearchParams();
      if (params?.limit) qs.set('limit', String(params.limit));
      if (params?.cursor) qs.set('cursor', params.cursor);
      if (params?.userId) qs.set('userId', params.userId);
      if (params?.status) qs.set('status', params.status);
      const q = qs.toString();
      return apiClient.get<AdminTransaction[]>(`/admin/transactions${q ? `?${q}` : ''}`);
    },
    reverse: (id: string, body: { reason: string }) =>
      apiClient.post(`/admin/transactions/${id}/reverse`, body),
    forceComplete: (id: string) =>
      apiClient.post(`/admin/transactions/${id}/force-complete`),
  },

  fraud: {
    listQueue: () =>
      apiClient.get<{ items: FraudQueueItem[]; total: number }>('/admin/fraud/queue'),
    approve: (caseId: string, body: { notes?: string }) =>
      apiClient.post(`/admin/fraud/${caseId}/approve`, body),
    block: (caseId: string, body: { notes?: string }) =>
      apiClient.post(`/admin/fraud/${caseId}/block`, body),
  },

  audit: {
    list: (params?: { actorId?: string; action?: string; startDate?: string; endDate?: string; page?: number; pageSize?: number }) => {
      const qs = new URLSearchParams();
      if (params?.actorId) qs.set('actorId', params.actorId);
      if (params?.action) qs.set('action', params.action);
      if (params?.startDate) qs.set('startDate', params.startDate);
      if (params?.endDate) qs.set('endDate', params.endDate);
      if (params?.page) qs.set('page', String(params.page));
      if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
      const q = qs.toString();
      return apiClient.get<{ entries: AuditLogEntry[]; total: number; page: number; pageSize: number; totalPages: number }>(`/admin/audit${q ? `?${q}` : ''}`);
    },
  },

  system: {
    getLimits: () => apiClient.get<SystemLimits>('/admin/system/limits'),
    patchLimits: (body: Partial<SystemLimits>) =>
      apiClient.patch<SystemLimits>('/admin/system/limits', body),
  },
};
