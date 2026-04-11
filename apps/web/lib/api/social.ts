import { apiClient } from './client';

export type RequestStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface Contact {
  id: string;
  ownerId: string;
  contactId: string;
  createdAt: string;
}

export interface MoneyRequest {
  id: string;
  requesterId: string;
  recipientId: string;
  amount: number;
  currency: string;
  note: string | null;
  status: RequestStatus;
  transactionId: string | null;
  expiresAt: string;
  createdAt: string;
  acceptedAt: string | null;
  declinedAt: string | null;
}

export type ParticipantStatus = 'PENDING' | 'PAID';

export interface SplitParticipant {
  id: string;
  userId: string;
  amountCents: number;
  status: ParticipantStatus;
  transactionId: string | null;
  paidAt: string | null;
}

export interface BillSplit {
  id: string;
  creatorId: string;
  title: string;
  totalCents: number;
  currency: string;
  status: 'OPEN' | 'SETTLED';
  settledAt: string | null;
  createdAt: string;
  participants?: SplitParticipant[];
}

export const socialApi = {
  contacts: {
    list: () => apiClient.get<Contact[]>('/api/v1/social/contacts/'),
    add: (body: { contactId: string }) =>
      apiClient.post<Contact>('/api/v1/social/contacts/', body),
    remove: (contactId: string) =>
      apiClient.delete<void>(`/api/v1/social/contacts/${contactId}`),
  },

  requests: {
    list: (status?: RequestStatus) => {
      const params = status ? `?status=${status}` : '';
      return apiClient.get<MoneyRequest[]>(`/api/v1/social/requests/${params}`);
    },
    create: (body: {
      recipientId: string;
      amount: number;
      currency?: string;
      note?: string;
    }) => apiClient.post<MoneyRequest>('/api/v1/social/requests/', body),
    accept: (id: string) =>
      apiClient.post<MoneyRequest>(`/api/v1/social/requests/${id}/accept`),
    decline: (id: string) =>
      apiClient.post<MoneyRequest>(`/api/v1/social/requests/${id}/decline`),
    cancel: (id: string) =>
      apiClient.delete<void>(`/api/v1/social/requests/${id}`),
  },

  splits: {
    list: () => apiClient.get<BillSplit[]>('/api/v1/social/splits/'),
    get: (id: string) =>
      apiClient.get<BillSplit>(`/api/v1/social/splits/${id}`),
    create: (body: {
      title: string;
      totalCents: number;
      currency?: string;
      participants: { userId: string; amountCents: number }[];
    }) => apiClient.post<BillSplit>('/api/v1/social/splits/', body),
    pay: (id: string, body: { transactionId: string }) =>
      apiClient.post<BillSplit>(`/api/v1/social/splits/${id}/pay`, body),
  },
};
