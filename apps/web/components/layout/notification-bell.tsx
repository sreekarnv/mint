'use client';

import { buttonVariants } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { apiClient } from '@/lib/api/client';
import {
  useNotificationStore,
  type Notification,
} from '@/lib/stores/notification.store';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowLeftRight,
  ArrowRight,
  Banknote,
  Bell,
  ShieldCheck,
  SplitSquareHorizontal,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

function getNotificationLink(type: string): string {
  if (type.startsWith('transaction') || type.startsWith('wallet'))
    return '/transactions';
  if (
    type === 'social.money_request_sent' ||
    type === 'social.money_request_accepted' ||
    type === 'social.money_request_declined' ||
    type === 'social.money_request_expired'
  ) {
    return '/social?tab=requests';
  }
  if (type === 'social.split_created' || type === 'social.split_settled') {
    return '/social?tab=splits';
  }
  if (type.startsWith('social')) return '/social';
  if (type.startsWith('kyc')) return '/kyc';
  return '/notifications';
}

// ─── Category metadata ────────────────────────────────────────────────────────

interface CategoryMeta {
  label: string;
  dot: string;
  iconBg: string;
  iconColor: string;
  Icon: React.FC<{ className?: string }>;
}

function getCategoryMeta(type: string): CategoryMeta {
  if (type.startsWith('transaction') || type.startsWith('wallet')) {
    return {
      label: 'Transaction',
      dot: 'bg-emerald-500',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      Icon: ArrowLeftRight,
    };
  }
  if (type.includes('money_request')) {
    return {
      label: 'Request',
      dot: 'bg-blue-500',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      Icon: Banknote,
    };
  }
  if (type.includes('split')) {
    return {
      label: 'Bill Split',
      dot: 'bg-violet-500',
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      Icon: SplitSquareHorizontal,
    };
  }
  if (type.startsWith('social')) {
    return {
      label: 'Social',
      dot: 'bg-sky-500',
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-600',
      Icon: Users,
    };
  }
  if (type.startsWith('kyc')) {
    return {
      label: 'Verification',
      dot: 'bg-amber-500',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      Icon: ShieldCheck,
    };
  }
  return {
    label: 'System',
    dot: 'bg-zinc-400',
    iconBg: 'bg-zinc-100',
    iconColor: 'text-zinc-500',
    Icon: Bell,
  };
}

// ─── Single item ──────────────────────────────────────────────────────────────

function NotificationItem({
  n,
  isLast,
  onClose,
}: {
  n: Notification;
  isLast: boolean;
  onClose: () => void;
}) {
  const markRead = useNotificationStore((s) => s.markRead);
  const meta = getCategoryMeta(n.type);
  const link = getNotificationLink(n.type);

  function handleClick() {
    if (!n.read) {
      apiClient
        .post(`/api/v1/notifications/${n.id}/read`)
        .then(() => markRead(n.id))
        .catch(() => {});
    }
    onClose();
  }

  return (
    <div className="relative flex gap-3 px-4">
      {!isLast && (
        <div className="absolute left-[26px] top-5 bottom-0 w-px bg-border/50" />
      )}

      <div className="relative shrink-0 mt-3 w-5 flex items-center justify-center">
        {!n.read && (
          <span
            className={cn(
              'absolute w-3.5 h-3.5 rounded-full animate-ping opacity-25',
              meta.dot,
            )}
          />
        )}
        <span
          className={cn(
            'relative z-10 w-2 h-2 rounded-full ring-2 ring-background',
            n.read ? 'bg-zinc-300' : meta.dot,
          )}
        />
      </div>

      <Link
        href={link}
        onClick={handleClick}
        className={cn(
          'group flex-1 flex items-start gap-2.5 py-3 mb-1.5 rounded-lg px-2.5 transition-all duration-200',
          n.read
            ? 'hover:bg-muted/50'
            : 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-border/40 hover:shadow-[0_2px_6px_rgba(0,0,0,0.08)]',
        )}
      >
        <div
          className={cn(
            'h-7 w-7 rounded-md flex items-center justify-center shrink-0',
            meta.iconBg,
          )}
        >
          <meta.Icon className={cn('h-3.5 w-3.5', meta.iconColor)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <span
              className={cn(
                'text-[9px] font-bold uppercase tracking-widest',
                n.read ? 'text-muted-foreground/50' : meta.iconColor,
              )}
            >
              {meta.label}
            </span>
            <span className="text-[9px] text-muted-foreground/30">·</span>
            <span className="text-[9px] text-muted-foreground/50 truncate">
              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p
            className={cn(
              'text-xs leading-snug line-clamp-1',
              n.read ? 'text-foreground/65' : 'text-foreground font-medium',
            )}
          >
            {n.title}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1 leading-relaxed">
            {n.body}
          </p>
        </div>
      </Link>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6">
      <div className="relative mb-5">
        <div className="absolute inset-0 -m-5 rounded-full border border-border/30" />
        <div className="absolute inset-0 -m-9 rounded-full border border-border/15" />
        <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center relative z-10">
          <Bell className="h-5 w-5 text-muted-foreground/40" />
        </div>
      </div>
      <p className="text-sm font-semibold text-foreground mt-4">
        All caught up
      </p>
      <p className="text-[11px] text-muted-foreground mt-1 text-center">
        No notifications yet
      </p>
    </div>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  function handleMarkAllRead() {
    apiClient
      .post('/api/v1/notifications/read-all')
      .then(() => markAllRead())
      .catch(() => {});
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'relative h-8 w-8',
        )}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white ring-2 ring-background leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </SheetTrigger>

      <SheetContent className="w-[340px] p-0 flex flex-col gap-0 border-l border-border">
        <SheetHeader className="shrink-0 px-4 pt-5 pb-4 border-b border-border/60">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50 mb-1">
              Activity
            </p>
            <SheetTitle className="text-base font-semibold leading-none">
              Notifications
            </SheetTitle>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-semibold text-foreground">
                  {unreadCount}
                </span>{' '}
                unread
              </p>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 pt-2">
          {!notifications?.length ? (
            <EmptyState />
          ) : (
            <div className="pb-2">
              {notifications.slice(0, 20).map((n, i) => (
                <NotificationItem
                  key={n.id}
                  n={n}
                  isLast={i === Math.min(notifications.length, 20) - 1}
                  onClose={() => setOpen(false)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="shrink-0 border-t border-border/60 px-4 py-3 flex items-center justify-between gap-3">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1.5 group"
            >
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                View all
              </span>
              <ArrowRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-200" />
            </Link>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                Mark all read
              </button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
