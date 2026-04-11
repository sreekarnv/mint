import { apiClient } from './client';

export type TxnType =
  | 'TOPUP'
  | 'TRANSFER'
  | 'RECURRING_TOPUP'
  | 'RECURRING_TRANSFER'
  | 'SPLIT_PAYMENT'
  | 'REQUEST_PAYMENT';

export type TxnStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REVERSED';

export type Category =
  | 'FOOD'
  | 'TRANSPORT'
  | 'ENTERTAINMENT'
  | 'UTILITIES'
  | 'OTHER';

export interface Transaction {
  id: string;
  type: TxnType;
  status: TxnStatus;
  amount: number;
  currency: string;
  description: string | null;
  senderId: string;
  recipientId: string;
  createdAt: string;
  completedAt: string | null;
}

export interface TransferBody {
  recipientId: string;
  amount: number;
  senderCurrency?: string;
  recipientCurrency?: string;
  description?: string;
  merchant?: string;
  category?: Category;
}

export interface TopupBody {
  amount: number;
  currency?: string;
  description?: string;
}

export const transactionsApi = {
  list: (params: { limit: number; cursor?: string }) => {
    const searchParams = new URLSearchParams({ limit: String(params.limit) });
    if (params.cursor) searchParams.set('cursor', params.cursor);
    return apiClient.get<Transaction[]>(
      `/api/v1/transactions/?${searchParams}`,
    );
  },

  get: (id: string) => apiClient.get<Transaction>(`/api/v1/transactions/${id}`),

  transfer: (body: TransferBody) =>
    apiClient.post<Transaction>('/api/v1/transactions/transfer', body, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }),

  topup: (body: TopupBody) =>
    apiClient.post<Transaction>('/api/v1/transactions/topup', body, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }),
};
