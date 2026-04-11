import { Amount } from '@/components/shared/amount';
import type { Transaction } from '@/lib/api/transactions';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ArrowDownLeft, ArrowUpRight, ChevronRight } from 'lucide-react';
import { statusDot, typeIcons, typeLabels } from './constants';

export function TxRow({
  tx,
  currentUserId,
  onClick,
}: {
  tx: Transaction;
  currentUserId: string;
  onClick: () => void;
}) {
  const isDeposit = tx.type === 'TOPUP' || tx.type === 'RECURRING_TOPUP';
  const isIncoming = isDeposit || tx.recipientId === currentUserId;
  const amount = isIncoming ? tx.amount : -tx.amount;
  const Icon = isIncoming ? ArrowDownLeft : (typeIcons[tx.type] ?? ArrowUpRight);

  return (
    <div
      className="flex items-center gap-3 py-3 px-5 cursor-pointer hover:bg-muted/30 transition-colors rounded-lg group"
      onClick={onClick}
    >
      <div
        className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
          isIncoming ? 'bg-emerald-50 text-emerald-600' : 'bg-muted text-muted-foreground',
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-none truncate">
          {tx.description ?? typeLabels[tx.type] ?? tx.type}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {format(new Date(tx.createdAt), 'h:mm a')}
          </span>
          <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', statusDot[tx.status] ?? 'bg-zinc-300')} />
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">
            {tx.status.charAt(0) + tx.status.slice(1).toLowerCase()}
          </span>
        </div>
      </div>

      <p
        className={cn(
          'text-sm font-semibold tabular-nums shrink-0',
          amount < 0 ? 'text-destructive' : 'text-emerald-600',
        )}
        style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
      >
        <Amount cents={amount} signed />
      </p>

      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/25 shrink-0 group-hover:text-muted-foreground/60 transition-colors" />
    </div>
  );
}
