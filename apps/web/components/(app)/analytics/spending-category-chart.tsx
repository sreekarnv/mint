import ChartTooltip from '@/components/(app)/analytics/chart-tooltip';
import {
  categoryColor,
  categoryLabel,
} from '@/components/(app)/analytics/constants';
import { Chart, ChartHeader } from '@/components/shared/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { MonthlyInsights } from '@/lib/api/analytics';
import { Tag } from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface SpendingCategoryChartProps extends React.ComponentProps<'div'> {
  isLoading: boolean;
  data?: MonthlyInsights;
}

function SpendingCategoryChart({
  data,
  isLoading,
  ...props
}: SpendingCategoryChartProps) {
  const chartData =
    data?.categories?.map((c) => ({
      name: categoryLabel(c.category),
      amount: parseFloat((c.total / 100).toFixed(2)),
      color: categoryColor(c.category),
    })) ?? [];

  return (
    <Chart header={<ChartHeader title="Spending by Category" />} {...props}>
      {isLoading ? (
        <Skeleton className="h-56 w-full rounded-lg" />
      ) : chartData.length === 0 ? (
        <div className="h-56 flex flex-col items-center justify-center gap-2">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <Tag className="h-5 w-5 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">No spending data yet</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barSize={36} barGap={6}>
            <XAxis
              dataKey="name"
              tick={{
                fontSize: 11,
                fill: 'var(--muted-foreground)',
                fontFamily: 'var(--font-sans)',
              }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{
                fontSize: 10,
                fill: 'var(--muted-foreground)',
                fontFamily: 'var(--font-sans)',
              }}
              tickFormatter={(v: number) =>
                `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`
              }
              tickLine={false}
              axisLine={false}
              width={44}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: '#F6F5F1', radius: 6 }}
            />
            <Bar dataKey="amount" radius={[5, 5, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} fillOpacity={0.9} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Chart>
  );
}

export default SpendingCategoryChart;
