'use client';

import { TxDetailDialog } from '@/components/(app)/transactions/tx-detail-dialog';
import { TxFilterBar } from '@/components/(app)/transactions/tx-filter-bar';
import { TxRow } from '@/components/(app)/transactions/tx-row';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  transactionsApi,
  type Transaction,
  type TxnStatus,
  type TxnType,
} from '@/lib/api/transactions';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useInfiniteQuery } from '@tanstack/react-query';
import { format, isToday, isYesterday } from 'date-fns';
import { ArrowLeftRight } from 'lucide-react';
import { useState } from 'react';

function groupByDate(txns: Transaction[]): { label: string; items: Transaction[] }[] {
  const map = new Map<string, Transaction[]>();
  for (const tx of txns) {
    const d = new Date(tx.createdAt);
    const key = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'MMMM d, yyyy');
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(tx);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

export function TransactionsClient() {
  const user = useAuthStore((s) => s.user);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: queryKeys.transactions.listInfinite(),
      queryFn: async ({ pageParam }: { pageParam?: string }) =>
        transactionsApi.list({ limit: 20, cursor: pageParam }),
      initialPageParam: undefined,
      getNextPageParam: (lastPage) =>
        lastPage && Array.isArray(lastPage) && lastPage.length === 20
          ? lastPage[lastPage.length - 1]?.id
          : undefined,
    });

  const allTxns = data?.pages.flat() ?? [];
  const filtered = allTxns.filter((tx) => {
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
    if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
    return true;
  });
  const groups = groupByDate(filtered);

  return (
    <div className="space-y-5">
      <TxFilterBar
        typeFilter={typeFilter}
        statusFilter={statusFilter}
        onTypeChange={(v) => setTypeFilter(v)}
        onStatusChange={(v) => setStatusFilter(v)}
        totalFiltered={filtered.length}
        isLoading={isLoading}
      />

      <div className="bg-white rounded-2xl border border-border/60 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <ArrowLeftRight className="h-5 w-5 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-foreground">No transactions found</p>
            {(typeFilter !== 'all' || statusFilter !== 'all') && (
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
            )}
          </div>
        ) : (
          <div>
            {groups.map(({ label, items }) => (
              <div key={label}>
                <div className="flex items-center gap-3 px-5 pt-4 pb-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
                    {label}
                  </span>
                  <div className="flex-1 h-px bg-border/50" />
                </div>
                <div>
                  {items.map((tx) => (
                    <TxRow
                      key={tx.id}
                      tx={tx}
                      currentUserId={user?.id ?? ''}
                      onClick={() => setSelectedTx(tx)}
                    />
                  ))}
                </div>
              </div>
            ))}
            <div className="h-2" />
          </div>
        )}
      </div>

      {hasNextPage && (
        <div className="flex justify-center pt-1">
          <Button variant="outline" size="sm" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}

      <TxDetailDialog
        tx={selectedTx}
        currentUserId={user?.id ?? ''}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
}
