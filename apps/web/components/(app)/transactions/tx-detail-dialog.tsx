'use client';

import { Amount } from '@/components/shared/amount';
import { StatusPill } from '@/components/shared/status-pill';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Transaction } from '@/lib/api/transactions';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { typeLabels } from './constants';

export function TxDetailDialog({
  tx,
  currentUserId,
  onClose,
}: {
  tx: Transaction | null;
  currentUserId: string;
  onClose: () => void;
}) {
  const isIncoming = tx
    ? tx.type === 'TOPUP' ||
      tx.type === 'RECURRING_TOPUP' ||
      tx.recipientId === currentUserId
    : false;

  return (
    <Dialog open={!!tx} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>
        {tx && (
          <div className="space-y-4 pt-1">
            <div className="text-center py-4 bg-muted/30 rounded-xl">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">
                {isIncoming ? 'Received' : 'Sent'}
              </p>
              <p
                className={cn(
                  'text-3xl font-semibold tabular-nums',
                  isIncoming ? 'text-emerald-600' : 'text-destructive',
                )}
                style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
              >
                <Amount cents={isIncoming ? tx.amount : -tx.amount} signed />
              </p>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Type', value: typeLabels[tx.type] ?? tx.type },
                { label: 'Status', value: <StatusPill status={tx.status} /> },
                { label: 'Date', value: format(new Date(tx.createdAt), 'MMM d, yyyy · h:mm a') },
                ...(tx.description ? [{ label: 'Note', value: tx.description }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-4">
                  <span className="text-xs text-muted-foreground shrink-0">{label}</span>
                  <span className="text-xs font-medium text-right">{value}</span>
                </div>
              ))}
            </div>

            <div>
              <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wide font-medium">
                Transaction ID
              </p>
              <p className="text-[11px] font-mono bg-muted rounded-lg px-3 py-2 break-all text-muted-foreground">
                {tx.id}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
