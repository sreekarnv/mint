'use client';

import RecentTransactionsTable from '@/components/(app)/dashboard/recent-transactions-table';
import StatStrip from '@/components/(app)/stat-strip';
import WalletBox from '@/components/(app)/wallet-box';
import { Amount } from '@/components/shared/amount';
import { analyticsApi } from '@/lib/api/analytics';
import { kycApi } from '@/lib/api/kyc';
import { transactionsApi } from '@/lib/api/transactions';
import { walletApi } from '@/lib/api/wallet';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/lib/stores/auth.store';
import { cn } from '@/lib/utils';
import { useQueries } from '@tanstack/react-query';
import { Activity, ShieldCheck, TrendingDown, Wallet } from 'lucide-react';
import Link from 'next/link';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const kycConfig = {
  UNVERIFIED: {
    bg: 'bg-zinc-100',
    text: 'text-zinc-500',
    icon: 'text-zinc-400',
  },
  BASIC: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-500' },
  VERIFIED: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    icon: 'text-emerald-500',
  },
};

export function DashboardClient() {
  const user = useAuthStore((s) => s.user);

  const [
    { data: wallet, isLoading: walletLoading },
    { data: transactions, isLoading: txLoading },
    { data: summary, isLoading: summaryLoading },
    { data: kycProfile },
  ] = useQueries({
    queries: [
      {
        queryKey: queryKeys.wallet.root(),
        queryFn: () => walletApi.get(),
      },
      {
        queryKey: queryKeys.transactions.list(),
        queryFn: () => transactionsApi.list({ limit: 6 }),
      },
      {
        queryKey: queryKeys.analytics.summary(),
        queryFn: () => analyticsApi.summary(),
      },
      {
        queryKey: queryKeys.kyc.profile(),
        queryFn: kycApi.getProfile,
      },
    ],
  });

  const tier = kycProfile?.tier ?? 'UNVERIFIED';
  const tierConfig = kycConfig[tier];
  const avgCents =
    summary && summary.transactionCount > 0
      ? Math.round(summary.totalSpend / summary.transactionCount)
      : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
            {getGreeting()}
          </p>
          <h2 className="text-xl font-semibold tracking-tight mt-0.5">
            {user?.name?.split(' ')[0] ?? 'Welcome back'}
          </h2>
        </div>
        <Link
          href="/kyc"
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-opacity hover:opacity-80',
            tierConfig.bg,
            tierConfig.text,
          )}
        >
          <ShieldCheck className={cn('h-3.5 w-3.5', tierConfig.icon)} />
          {tier.charAt(0) + tier.slice(1).toLowerCase()}
        </Link>
      </div>

      <WalletBox wallet={wallet} isLoading={walletLoading} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatStrip
          label="Spent"
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
          icon={Activity}
          iconBg="bg-primary/8"
          iconColor="text-primary"
          loading={summaryLoading}
        />
        <StatStrip
          label="Avg / Transaction"
          value={<Amount cents={avgCents} />}
          sub="this month"
          icon={Wallet}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          loading={summaryLoading}
        />
      </div>

      <RecentTransactionsTable
        user={user}
        isLoading={txLoading}
        transactions={transactions}
      />
    </div>
  );
}
