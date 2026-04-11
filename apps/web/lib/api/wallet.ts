import { apiClient } from './client';

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  status: 'active' | 'frozen' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface BalanceHistoryEntry {
  id: string;
  delta: number;
  balanceAfter: number;
  transactionId: string | null;
  createdAt: string;
}

export interface WalletHistory {
  walletId: string;
  history: BalanceHistoryEntry[];
}

export const walletApi = {
  get: () => apiClient.get<Wallet>('/api/v1/wallet/'),

  history: () => apiClient.get<WalletHistory>('/api/v1/wallet/history'),
};
