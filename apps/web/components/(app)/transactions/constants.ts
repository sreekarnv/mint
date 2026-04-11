import {
  ArrowUpRight,
  Banknote,
  RefreshCw,
  Repeat2,
  Users,
} from 'lucide-react';
import type { TxnStatus, TxnType } from '@/lib/api/transactions';

export const typeLabels: Record<string, string> = {
  TOPUP: 'Deposit',
  TRANSFER: 'Transfer',
  RECURRING_TOPUP: 'Recurring Deposit',
  RECURRING_TRANSFER: 'Recurring Transfer',
  SPLIT_PAYMENT: 'Split Payment',
  REQUEST_PAYMENT: 'Money Request',
};

export const typeIcons: Record<string, React.FC<{ className?: string }>> = {
  TOPUP: Banknote,
  TRANSFER: ArrowUpRight,
  RECURRING_TOPUP: RefreshCw,
  RECURRING_TRANSFER: Repeat2,
  SPLIT_PAYMENT: Users,
  REQUEST_PAYMENT: Banknote,
};

export const statusDot: Record<string, string> = {
  COMPLETED: 'bg-emerald-500',
  FAILED: 'bg-red-500',
  PENDING: 'bg-amber-400',
  PROCESSING: 'bg-amber-400',
  CANCELLED: 'bg-zinc-400',
  REVERSED: 'bg-zinc-400',
};

export const allTypes: TxnType[] = [
  'TOPUP',
  'TRANSFER',
  'RECURRING_TOPUP',
  'RECURRING_TRANSFER',
  'SPLIT_PAYMENT',
  'REQUEST_PAYMENT',
];

export const allStatuses: TxnStatus[] = [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'REVERSED',
];
