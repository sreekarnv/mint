import type { Transaction } from '@/lib/api/transactions';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  RefreshCw,
  Repeat2,
  Users,
} from 'lucide-react';
import { Amount } from './amount';

interface TransactionRowProps {
  transaction: Transaction;
  currentUserId: string;
  onClick?: () => void;
}

const typeLabels: Record<string, string> = {
  TOPUP: 'Deposit',
  TRANSFER: 'Transfer',
  RECURRING_TOPUP: 'Recurring Deposit',
  RECURRING_TRANSFER: 'Recurring Transfer',
  SPLIT_PAYMENT: 'Split Payment',
  REQUEST_PAYMENT: 'Money Request',
};

const typeIcons: Record<string, React.FC<{ className?: string }>> = {
  TOPUP: Banknote,
  TRANSFER: ArrowUpRight,
  RECURRING_TOPUP: RefreshCw,
  RECURRING_TRANSFER: Repeat2,
  SPLIT_PAYMENT: Users,
  REQUEST_PAYMENT: Banknote,
};

const statusDot: Record<string, string> = {
  COMPLETED: 'bg-emerald-500',
  FAILED: 'bg-red-500',
  PENDING: 'bg-amber-400',
  PROCESSING: 'bg-amber-400',
  CANCELLED: 'bg-zinc-400',
  REVERSED: 'bg-zinc-400',
};

export function TransactionRow({
  transaction,
  currentUserId,
  onClick,
}: TransactionRowProps) {
  const isDeposit =
    transaction.type === 'TOPUP' || transaction.type === 'RECURRING_TOPUP';
  const isIncoming = isDeposit || transaction.recipientId === currentUserId;
  const amount = isIncoming ? transaction.amount : -transaction.amount;

  const Icon =
    (isIncoming ? ArrowDownLeft : typeIcons[transaction.type]) ?? ArrowUpRight;

  return (
    <div
      className={cn(
        'flex items-center justify-between py-3 rounded-lg transition-colors',
        onClick && 'cursor-pointer hover:bg-muted/40',
        !onClick && 'cursor-default',
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
            isIncoming
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-muted text-muted-foreground',
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground leading-none">
            {transaction.description ??
              typeLabels[transaction.type] ??
              transaction.type}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">
              {format(new Date(transaction.createdAt), 'MMM d, h:mm a')}
            </span>
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                statusDot[transaction.status] ?? 'bg-zinc-300',
              )}
            />
            <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wide">
              {transaction.status.charAt(0) +
                transaction.status.slice(1).toLowerCase()}
            </span>
          </div>
        </div>
      </div>
      <p
        className={cn(
          'text-sm font-semibold tabular-nums',
          amount < 0 ? 'text-destructive' : 'text-emerald-600',
        )}
      >
        <Amount cents={amount} signed />
      </p>
    </div>
  );
}
