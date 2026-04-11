import { Amount } from '@/components/shared/amount';
import { Chart, ChartHeader } from '@/components/shared/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { TopMerchant } from '@/lib/api/analytics';
import { cn } from '@/lib/utils';
import { ArrowUpRight } from 'lucide-react';

interface TopMerchantChartProps extends React.ComponentProps<'div'> {
  merchantsLoading: boolean;
  merchants?: TopMerchant[];
}

function TopMerchantChart({
  merchantsLoading,
  merchants,
  ...props
}: TopMerchantChartProps) {
  return (
    <Chart header={<ChartHeader title="Top Merchants" />} {...props}>
      {merchantsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : !merchants?.length ? (
        <div className="h-24 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No merchant data yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {merchants.slice(0, 6).map((m, i) => {
            const max = merchants[0]?.total ?? 1;
            const pct = Math.round((m.total / max) * 100);
            const isTop = i === 0;
            return (
              <div
                key={i}
                className={cn(
                  'relative flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors',
                  isTop
                    ? 'border-primary/20 bg-primary/3'
                    : 'border-border/60 bg-transparent hover:bg-muted/30',
                )}
              >
                <span
                  className={cn(
                    'text-[11px] font-bold w-5 shrink-0 text-center',
                    isTop ? 'text-primary' : 'text-muted-foreground/40',
                  )}
                >
                  {i + 1}
                </span>

                <div
                  className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold',
                    isTop
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {m.merchant.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {m.merchant}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          isTop ? 'bg-primary' : 'bg-muted-foreground/30',
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <p
                  className={cn(
                    'text-xs font-semibold tabular-nums shrink-0',
                    isTop ? 'text-primary' : 'text-foreground/70',
                  )}
                  style={{
                    fontFamily: 'var(--font-display), Georgia, serif',
                  }}
                >
                  <Amount cents={m.total} />
                </p>
                {isTop && (
                  <ArrowUpRight className="h-3 w-3 text-primary/50 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </Chart>
  );
}

export default TopMerchantChart;
