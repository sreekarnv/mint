import { apiClient } from './client';

export type KycTier = 'UNVERIFIED' | 'BASIC' | 'VERIFIED';
export type KycStatus = 'NONE' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
export type DocType =
  | 'PASSPORT'
  | 'DRIVERS_LICENSE'
  | 'SELFIE'
  | 'UTILITY_BILL'
  | 'OTHER';

export interface KycDocument {
  id: string;
  profileId: string;
  type: DocType;
  docName: string | null;
  status: string;
  uploadedAt: string;
}

export interface KycProfile {
  id: string;
  userId: string;
  tier: KycTier;
  status: KycStatus;
  providerRef: string | null;
  rejectionReason: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
  createdAt: string;
  kycDocuments: KycDocument[];
}

export interface KycLimits {
  tier: KycTier;
  perTxnCents: number;
  dailyCents: number;
  monthlyCents: number;
  limitsCurrency: string;
}

export const kycApi = {
  getProfile: () => apiClient.get<KycProfile>('/api/v1/kyc/'),

  getLimits: () => apiClient.get<KycLimits>('/api/v1/kyc/limits'),

  submit: () => apiClient.post<KycProfile>('/api/v1/kyc/submit'),

  uploadDocument: async (file: File, type: DocType) => {
    const formData = new FormData();
    formData.append('file', file);
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost';
    const res = await fetch(
      `${baseUrl}/api/v1/kyc/documents?type=${type}`,
      {
        method: 'POST',
        credentials: 'include',
        body: formData,
      },
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message ?? 'Upload failed');
    }
    return res.json() as Promise<KycDocument>;
  },
};
