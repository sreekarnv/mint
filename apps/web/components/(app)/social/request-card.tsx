'use client';

import { Amount } from '@/components/shared/amount';
import { Button } from '@/components/ui/button';
import { type MoneyRequest } from '@/lib/api/social';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Check, Loader2 } from 'lucide-react';
import { UserAvatar as Avatar } from '@/components/shared/avatar';
import { StatusPill } from '@/components/shared/status-pill';

export function RequestCard({
  request,
  isIncoming,
  onAccept,
  onDecline,
  onCancel,
  acceptPending,
  declinePending,
  cancelPending,
}: {
  request: MoneyRequest;
  isIncoming: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
  acceptPending?: boolean;
  declinePending?: boolean;
  cancelPending?: boolean;
}) {
  const isPending = request.status === 'PENDING';
  const counterparty = isIncoming ? request.requesterId : request.recipientId;

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 space-y-3 transition-colors',
        isPending && isIncoming ? 'border-amber-200 bg-amber-50/20' : 'border-border',
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar id={counterparty} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-sm font-semibold tabular-nums"
              style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
            >
              <Amount cents={request.amount} />
            </span>
            <StatusPill status={request.status} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isIncoming ? 'From' : 'To'} {counterparty.slice(0, 10)}…{' · '}
            {format(new Date(request.createdAt), 'MMM d, yyyy')}
          </p>
          {request.note && (
            <p className="text-xs text-muted-foreground mt-1 italic">
              "{request.note}"
            </p>
          )}
        </div>
      </div>

      {isPending && (
        <div className="flex gap-2">
          {isIncoming ? (
            <>
              <Button size="sm" className="flex-1" onClick={onAccept} disabled={acceptPending}>
                {acceptPending ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                )}
                Pay {acceptPending ? '…' : ''}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={onDecline}
                disabled={declinePending}
              >
                Decline
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={onCancel}
              disabled={cancelPending}
            >
              Cancel Request
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
