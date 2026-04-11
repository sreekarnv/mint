import { User } from '@/lib/api/auth';
import { Transaction } from '@/lib/api/transactions';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { TransactionRow } from '../../shared/transaction-row';
import { buttonVariants } from '../../ui/button';
import { Skeleton } from '../../ui/skeleton';

interface RecentTransactionsProps {
  isLoading?: boolean;
  transactions?: Transaction[];
  user: User | null;
}

function RecentTransactionsTable({
  isLoading,
  transactions,
  user,
}: RecentTransactionsProps) {
  return (
    <>
      <div className="bg-white rounded-2xl border border-border/60 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-px w-4 bg-primary/40" />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">
              Recent Activity
            </h2>
          </div>
          <Link
            href="/transactions"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            View all
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="px-5 pb-5 space-y-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-4 w-14" />
              </div>
            ))}
          </div>
        ) : !transactions?.length ? (
          <div className="px-5 pb-8 pt-4 text-center">
            <p className="text-sm text-muted-foreground">No transactions yet</p>
            <Link
              href="/wallet"
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className: 'mt-3',
              })}
            >
              Make your first deposit
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {transactions.map((tx) => (
              <div key={tx.id} className="px-5">
                <TransactionRow
                  transaction={tx}
                  currentUserId={user?.id ?? ''}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default RecentTransactionsTable;
