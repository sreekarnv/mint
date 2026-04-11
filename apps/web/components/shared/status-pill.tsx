import { cn } from '@/lib/utils';

// Covers statuses from transactions, social requests, bill splits, and KYC
export const statusStyles: Record<string, string> = {
  // Transaction statuses
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  FAILED: 'bg-red-50 text-red-700 border-red-200',
  PROCESSING: 'bg-amber-50 text-amber-700 border-amber-200',
  REVERSED: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  // Shared
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  CANCELLED: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  // Social request statuses
  ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DECLINED: 'bg-red-50 text-red-700 border-red-200',
  EXPIRED: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  // Bill split statuses
  OPEN: 'bg-amber-50 text-amber-700 border-amber-200',
  CLOSED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  // KYC statuses
  PENDING_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
  VERIFIED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
};

export function StatusPill({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
        statusStyles[status] ?? 'bg-zinc-100 text-zinc-600 border-zinc-200',
        className,
      )}
    >
      {status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, ' ')}
    </span>
  );
}
