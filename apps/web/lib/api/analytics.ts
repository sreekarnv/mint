import { apiClient } from './client';
import type { Category } from './transactions';

export interface CategoryInsight {
  category: Category;
  total: number;
  count: number;
  percentage: number;
}

export interface MonthlyInsights {
  yearMonth: string;
  total: number;
  categories: CategoryInsight[];
}

export interface TopMerchant {
  merchant: string;
  total: number;
}

export interface MonthlySummary {
  yearMonth: string;
  totalSpend: number;
  transactionCount: number;
}

export interface Budget {
  id: string;
  userId: string;
  category: Category;
  limitCents: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const analyticsApi = {
  insights: () => apiClient.get<MonthlyInsights>('/api/v1/analytics/insights'),

  summary: () => apiClient.get<MonthlySummary>('/api/v1/analytics/summary'),

  topMerchants: () =>
    apiClient.get<TopMerchant[]>('/api/v1/analytics/top-merchants'),

  budgets: () => apiClient.get<Budget[]>('/api/v1/analytics/budgets'),

  createBudget: (body: { category: Category; limitCents: number }) =>
    apiClient.post<Budget>('/api/v1/analytics/budgets', body),

  deleteBudget: (id: string) =>
    apiClient.delete<void>(`/api/v1/analytics/budgets/${id}`),
};
