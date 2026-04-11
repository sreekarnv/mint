'use client';

import { BalanceChart } from '@/components/(app)/wallet/balance-chart';
import { TransactionLimitsCard } from '@/components/(app)/wallet/transaction-limits-card';
import { WalletStatCards } from '@/components/(app)/wallet/wallet-stat-cards';
import WalletBox from '@/components/(app)/wallet-box';
import { kycApi } from '@/lib/api/kyc';
import { transactionsApi } from '@/lib/api/transactions';
import { walletApi } from '@/lib/api/wallet';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useQueries, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

export function WalletClient() {
  const user = useAuthStore((s) => s.user);

  const [
    { data: wallet, isLoading: walletLoading },
    { data: history, isLoading: historyLoading },
    { data: limits, isLoading: limitsLoading },
  ] = useQueries({
    queries: [
      { queryKey: queryKeys.wallet.root(), queryFn: () => walletApi.get() },
      { queryKey: queryKeys.wallet.history(), queryFn: () => walletApi.history() },
      { queryKey: queryKeys.kyc.limits(), queryFn: () => kycApi.getLimits() },
    ],
  });

  const { data: txList, isLoading: txLoading } = useQuery({
    queryKey: queryKeys.transactions.list(),
    queryFn: () => transactionsApi.list({ limit: 100 }),
  });

  const completed = (txList ?? []).filter((tx) => tx.status === 'COMPLETED');
  const depositCount = completed.filter(
    (tx) => tx.type === 'TOPUP' || tx.type === 'RECURRING_TOPUP',
  ).length;
  const sentCount = completed.filter(
    (tx) =>
      (tx.type === 'TRANSFER' || tx.type === 'RECURRING_TRANSFER' ||
        tx.type === 'SPLIT_PAYMENT' || tx.type === 'REQUEST_PAYMENT') &&
      tx.senderId === user?.id,
  ).length;
  const receivedCount = completed.filter(
    (tx) =>
      (tx.type === 'TRANSFER' || tx.type === 'RECURRING_TRANSFER' ||
        tx.type === 'SPLIT_PAYMENT' || tx.type === 'REQUEST_PAYMENT') &&
      tx.recipientId === user?.id,
  ).length;

  const chartData = (history?.history ?? [])
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((e) => ({
      date: format(new Date(e.createdAt), 'MMM d'),
      balance: parseFloat((e.balanceAfter / 100).toFixed(2)),
      delta: e.delta,
    }));

  return (
    <div className="space-y-6">
      <WalletBox wallet={wallet} isLoading={walletLoading} />

      <WalletStatCards
        depositCount={depositCount}
        sentCount={sentCount}
        receivedCount={receivedCount}
        isLoading={txLoading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BalanceChart data={chartData} isLoading={historyLoading} className="lg:col-span-2" />
        <TransactionLimitsCard limits={limits} isLoading={limitsLoading} />
      </div>
    </div>
  );
}
