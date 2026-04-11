'use client';

import { Amount } from '@/components/shared/amount';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { socialApi, type BillSplit } from '@/lib/api/social';
import { transactionsApi } from '@/lib/api/transactions';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ChevronDown, ChevronRight, Loader2, SplitSquareHorizontal } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { UserAvatar as Avatar } from '@/components/shared/avatar';
import { StatusPill } from '@/components/shared/status-pill';

export function SplitRow({
  split,
  currentUserId,
  onPaySuccess,
}: {
  split: BillSplit;
  currentUserId?: string;
  onPaySuccess: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const { data: detail, isLoading } = useQuery({
    queryKey: queryKeys.social.split(split.id),
    queryFn: () => socialApi.splits.get(split.id),
    enabled: expanded,
  });

  const payMutation = useMutation({
    mutationFn: async ({
      splitId,
      creatorId,
      amountCents,
    }: {
      splitId: string;
      creatorId: string;
      amountCents: number;
    }) => {
      const tx = await transactionsApi.transfer({
        recipientId: creatorId,
        amount: amountCents,
        description: `Split: ${split.title}`,
      });
      return socialApi.splits.pay(splitId, { transactionId: tx.id });
    },
    onSuccess: () => {
      onPaySuccess();
      toast.success('Share paid');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const myParticipant = detail?.participants?.find((p) => p.userId === currentUserId);
  const canPay = myParticipant?.status === 'PENDING' && split.status === 'OPEN';
  const paidCount = detail?.participants?.filter((p) => p.status === 'PAID').length ?? 0;
  const totalCount = detail?.participants?.length ?? 0;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <SplitSquareHorizontal className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold truncate">{split.title}</span>
            <StatusPill status={split.status} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="tabular-nums font-medium">
              <Amount cents={split.totalCents} />
            </span>
            {' · '}
            {format(new Date(split.createdAt), 'MMM d, yyyy')}
            {expanded && totalCount > 0 && ` · ${paidCount}/${totalCount} paid`}
          </p>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-border">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {detail?.participants?.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar id={p.userId} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {p.userId === currentUserId ? 'You' : p.userId.slice(0, 10) + '…'}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      <Amount cents={p.amountCents} />
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'text-xs font-semibold',
                        p.status === 'PAID' ? 'text-emerald-600' : 'text-amber-600',
                      )}
                    >
                      {p.status === 'PAID' ? '✓ Paid' : 'Pending'}
                    </span>
                    {p.userId === currentUserId && canPay && (
                      <Button
                        size="sm"
                        disabled={payMutation.isPending}
                        onClick={() =>
                          payMutation.mutate({
                            splitId: split.id,
                            creatorId: split.creatorId,
                            amountCents: p.amountCents,
                          })
                        }
                      >
                        {payMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          'Pay my share'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
