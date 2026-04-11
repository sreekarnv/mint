'use client';

import { Chart, ChartHeader } from '@/components/shared/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp } from 'lucide-react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface BalanceDataPoint {
  date: string;
  balance: number;
  delta: number;
}

function BalanceTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value as number;
  return (
    <div className="bg-white border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-0.5">
        Balance
      </p>
      <p className="text-sm font-semibold tabular-nums">
        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)}
      </p>
    </div>
  );
}

export function BalanceChart({
  data,
  isLoading,
  className,
}: {
  data: BalanceDataPoint[];
  isLoading: boolean;
  className?: string;
}) {
  return (
    <Chart
      className={className}
      header={
        <ChartHeader title="Balance History" description="Running balance over time" />
      }
    >
      {isLoading ? (
        <Skeleton className="h-52 w-full rounded-lg" />
      ) : data.length === 0 ? (
        <div className="h-52 flex flex-col items-center justify-center gap-2">
          <TrendingUp className="h-8 w-8 text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">No history yet</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-sans)' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-sans)' }}
              tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
              tickLine={false}
              axisLine={false}
              width={44}
            />
            <Tooltip
              content={<BalanceTooltip />}
              cursor={{ stroke: '#1D4ED8', strokeWidth: 1, strokeDasharray: '4 2' }}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#1D4ED8"
              strokeWidth={2}
              fill="url(#balGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#1D4ED8', stroke: 'white', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Chart>
  );
}
