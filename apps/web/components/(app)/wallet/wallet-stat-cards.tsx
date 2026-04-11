import { cn } from '@/lib/utils';
import { ArrowDownLeft, ArrowUpRight, Banknote } from 'lucide-react';

const stats = [
  { key: 'deposits', label: 'Deposits', icon: Banknote, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  { key: 'sent', label: 'Transfers Sent', icon: ArrowUpRight, iconBg: 'bg-rose-50', iconColor: 'text-rose-500' },
  { key: 'received', label: 'Transfers Received', icon: ArrowDownLeft, iconBg: 'bg-primary/8', iconColor: 'text-primary' },
] as const;

export function WalletStatCards({
  depositCount,
  sentCount,
  receivedCount,
  isLoading,
}: {
  depositCount: number;
  sentCount: number;
  receivedCount: number;
  isLoading: boolean;
}) {
  const values: Record<string, number> = {
    deposits: depositCount,
    sent: sentCount,
    received: receivedCount,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {stats.map(({ key, label, icon: Icon, iconBg, iconColor }) => (
        <div
          key={key}
          className="bg-white rounded-2xl border border-border/60 shadow-[0_1px_3px_rgba(0,0,0,0.05)] px-4 py-4 flex items-start gap-3"
        >
          <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
            <Icon className={cn('h-4 w-4', iconColor)} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/55 leading-tight mb-1.5">
              {label}
            </p>
            {isLoading ? (
              <div className="h-5 w-8 bg-muted animate-pulse rounded" />
            ) : (
              <p
                className="text-xl font-semibold tabular-nums leading-none"
                style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
              >
                {values[key]}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
