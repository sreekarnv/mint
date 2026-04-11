'use client';

import BreakdownChart from '@/components/(app)/analytics/breakdown-chart';
import BudgetChart from '@/components/(app)/analytics/budget-chart';
import { categoryLabel } from '@/components/(app)/analytics/constants';
import SpendingCategoryChart from '@/components/(app)/analytics/spending-category-chart';
import TopMerchantChart from '@/components/(app)/analytics/top-merchant-chart';
import StatStrip from '@/components/(app)/stat-strip';
import { Amount } from '@/components/shared/amount';
import { analyticsApi } from '@/lib/api/analytics';
import { queryKeys } from '@/lib/query-keys';
import { useQueries } from '@tanstack/react-query';
import { Receipt, Tag, TrendingDown, Wallet } from 'lucide-react';

export function AnalyticsClient() {
  const [
    { data: insights, isLoading: insightsLoading },
    { data: summary, isLoading: summaryLoading },
    { data: merchants, isLoading: merchantsLoading },
    { data: budgets, isLoading: budgetsLoading },
  ] = useQueries({
    queries: [
      {
        queryKey: queryKeys.analytics.insights(),
        queryFn: analyticsApi.insights,
      },
      {
        queryKey: queryKeys.analytics.summary(),
        queryFn: analyticsApi.summary,
      },
      {
        queryKey: queryKeys.analytics.topMerchants(),
        queryFn: analyticsApi.topMerchants,
      },
      {
        queryKey: queryKeys.analytics.budgets(),
        queryFn: analyticsApi.budgets,
      },
    ],
  });

  const avgCents =
    summary && summary.transactionCount > 0
      ? Math.round(summary.totalSpend / summary.transactionCount)
      : 0;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatStrip
          label="Total Spend"
          value={<Amount cents={summary?.totalSpend ?? 0} />}
          sub="this month"
          icon={TrendingDown}
          iconBg="bg-rose-50"
          iconColor="text-rose-500"
          loading={summaryLoading}
        />
        <StatStrip
          label="Transactions"
          value={summary?.transactionCount ?? 0}
          sub="this month"
          icon={Receipt}
          iconBg="bg-primary/8"
          iconColor="text-primary"
          loading={summaryLoading}
        />
        <StatStrip
          label="Avg per Transaction"
          value={<Amount cents={avgCents} />}
          sub="this month"
          icon={Wallet}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          loading={summaryLoading}
        />
        <StatStrip
          label="Top Category"
          value={
            insights?.categories?.[0]
              ? categoryLabel(insights.categories[0].category)
              : '—'
          }
          sub={
            insights?.categories?.[0]
              ? `${insights.categories[0].percentage.toFixed(0)}% of spend`
              : 'no data yet'
          }
          icon={Tag}
          iconBg="bg-violet-50"
          iconColor="text-violet-500"
          loading={insightsLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <SpendingCategoryChart
          className="lg:col-span-3"
          data={insights}
          isLoading={insightsLoading}
        />

        <BreakdownChart
          className="lg:col-span-2"
          data={insights}
          isLoading={insightsLoading}
        />
      </div>

      <TopMerchantChart
        merchants={merchants}
        merchantsLoading={merchantsLoading}
      />
      <BudgetChart
        budgets={budgets}
        insights={insights}
        budgetsLoading={budgetsLoading}
      />
    </div>
  );
}
