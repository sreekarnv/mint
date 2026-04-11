import { Amount } from '@/components/shared/amount';
import { Chart, ChartHeader } from '@/components/shared/chart';
import { Skeleton } from '@/components/ui/skeleton';
import type { KycLimits } from '@/lib/api/kyc';
import { cn } from '@/lib/utils';
import { ArrowLeftRight, ArrowUpRight, TrendingUp } from 'lucide-react';

const limitRows = [
  { key: 'perTxnCents', label: 'Per Transaction', icon: ArrowUpRight, iconBg: 'bg-primary/8', iconColor: 'text-primary' },
  { key: 'dailyCents', label: 'Daily Limit', icon: TrendingUp, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  { key: 'monthlyCents', label: 'Monthly Limit', icon: ArrowLeftRight, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
] as const;

export function TransactionLimitsCard({
  limits,
  isLoading,
}: {
  limits: KycLimits | undefined;
  isLoading: boolean;
}) {
  return (
    <Chart header={<ChartHeader title="Transaction Limits" description="Based on your KYC tier" />}>
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {limitRows.map(({ key, label, icon: Icon, iconBg, iconColor }) => (
            <div
              key={key}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/40"
            >
              <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', iconBg)}>
                <Icon className={cn('h-3.5 w-3.5', iconColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wide">
                  {label}
                </p>
                <p
                  className="text-base font-semibold tabular-nums leading-tight mt-0.5"
                  style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
                >
                  <Amount cents={limits?.[key] ?? 0} />
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Chart>
  );
}
