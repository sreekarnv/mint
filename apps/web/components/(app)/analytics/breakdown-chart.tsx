import {
  CATEGORY_META,
  categoryLabel,
} from '@/components/(app)/analytics/constants';
import { Amount } from '@/components/shared/amount';
import { Chart, ChartHeader } from '@/components/shared/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { MonthlyInsights } from '@/lib/api/analytics';

interface BreakdownChartProps extends React.ComponentProps<'div'> {
  isLoading?: boolean;
  data?: MonthlyInsights;
}

function BreakdownChart({ isLoading, data, ...props }: BreakdownChartProps) {
  return (
    <Chart
      id="analytics-breakdown"
      header={<ChartHeader title="Breakdown" />}
      {...props}
    >
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded" />
          ))}
        </div>
      ) : !data?.categories?.length ? (
        <div className="h-40 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No data yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.categories.map((c) => {
            const meta = CATEGORY_META[c.category];

            return (
              <div key={c.category}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: meta?.color ?? '#6B7280' }}
                    />
                    <span className="text-xs font-medium text-foreground">
                      {meta?.label ?? categoryLabel(c.category)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                      {c.count} txns
                    </span>
                    <span
                      className="text-xs font-semibold tabular-nums text-foreground"
                      style={{
                        fontFamily: 'var(--font-display), Georgia, serif',
                      }}
                    >
                      <Amount cents={c.total} />
                    </span>
                  </div>
                </div>
                <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                    style={{
                      width: `${c.percentage}%`,
                      backgroundColor: meta?.color ?? '#6B7280',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Chart>
  );
}

export default BreakdownChart;
