import { DocType } from '@/lib/api/kyc';
import { type LucideProps, ShieldCheck, ShieldOff } from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';

export interface TierLimit {
  perTxn: string;
  daily: string;
  monthly: string;
}

export interface Tier {
  key: string;
  label: string;
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
  >;
  color: string;
  bg: string;
  activeBorder: string;
  limits: TierLimit;
  features: string[];
  locked: string[];
  requirement: string | null;
}

export const TIERS: Tier[] = [
  {
    key: 'UNVERIFIED' as const,
    label: 'Unverified',
    icon: ShieldOff,
    color: 'text-zinc-500',
    bg: 'bg-zinc-100',
    activeBorder: 'border-zinc-400',
    limits: { perTxn: '$50', daily: '$100', monthly: '$200' },
    features: ['Basic account access', 'View balance & history'],
    locked: ['Deposits above $50', 'Transfers', 'Money requests'],
    requirement: null,
  },
  {
    key: 'BASIC' as const,
    label: 'Basic',
    icon: ShieldCheck,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    activeBorder: 'border-blue-400',
    limits: { perTxn: '$500', daily: '$2,000', monthly: '$10,000' },
    features: [
      'Deposits up to $500',
      'Send & receive money',
      'Money requests & splits',
    ],
    locked: ['Higher monthly limits', 'Premium features'],
    requirement: 'Government ID + selfie',
  },
  {
    key: 'VERIFIED' as const,
    label: 'Verified',
    icon: ShieldCheck,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    activeBorder: 'border-emerald-500',
    limits: { perTxn: '$10,000', daily: '$50,000', monthly: '$200,000' },
    features: [
      'Deposits up to $10,000',
      'Full transfer access',
      'Priority support',
      'All features unlocked',
    ],
    locked: [],
    requirement: null,
  },
];

export const statusBadge: Record<
  string,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  }
> = {
  NONE: { label: 'Not submitted', variant: 'secondary' },
  PENDING_REVIEW: { label: 'Under review', variant: 'outline' },
  APPROVED: { label: 'Approved', variant: 'default' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
};

export const ID_DOC_OPTIONS: {
  type: DocType;
  label: string;
  description: string;
}[] = [
  {
    type: 'PASSPORT',
    label: 'Passport',
    description: 'Government-issued passport',
  },
  {
    type: 'DRIVERS_LICENSE',
    label: "Driver's license",
    description: "State or national driver's license",
  },
];
