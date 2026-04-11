import { Notification } from '@/lib/stores/notification.store';
import { cn } from '@/lib/utils';
import { format } from 'date-fns/format';
import {
  ArrowLeftRight,
  Banknote,
  Bell,
  ChevronRight,
  ShieldCheck,
  SplitSquareHorizontal,
  Users,
} from 'lucide-react';
import Link from 'next/link';

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

function NotificationItem({
  n,
  isLast,
  onRead,
}: {
  n: Notification;
  isLast: boolean;
  onRead: (n: Notification) => void;
}) {
  const meta = getCategoryMeta(n.type);
  const link = getNotificationLink(n.type);

  return (
    <div className="relative flex gap-5">
      {!isLast && (
        <div className="absolute left-[9px] top-5 bottom-0 w-px bg-border/60" />
      )}

      <div className="relative shrink-0 mt-3.5 w-5 flex items-center justify-center">
        {!n.read && (
          <span
            className={cn(
              'absolute w-4 h-4 rounded-full animate-ping opacity-25',
              meta.dot,
            )}
          />
        )}
        <span
          className={cn(
            'relative z-10 w-[10px] h-[10px] rounded-full ring-2 ring-background',
            n.read ? 'bg-zinc-300' : meta.dot,
          )}
        />
      </div>

      <Link
        href={link}
        onClick={() => onRead(n)}
        className={cn(
          'group flex-1 flex items-start gap-3 px-4 py-3.5 rounded-xl mb-2 transition-all duration-200',
          n.read
            ? 'hover:bg-black/3'
            : 'bg-white shadow-[0_1px_4px_rgba(0,0,0,0.07)] border border-border/50 hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)]',
        )}
      >
        <div
          className={cn(
            'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
            meta.iconBg,
          )}
        >
          <meta.Icon className={cn('h-4 w-4', meta.iconColor)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className={cn(
                'text-[10px] font-bold uppercase tracking-widest',
                n.read ? 'text-muted-foreground/60' : meta.iconColor,
              )}
            >
              {meta.label}
            </span>
            <span className="text-[10px] text-muted-foreground/40">·</span>
            <span className="text-[10px] text-muted-foreground/50">
              {format(new Date(n.createdAt), 'h:mm a')}
            </span>
          </div>
          <p
            className={cn(
              'text-sm leading-snug',
              n.read
                ? 'text-foreground/75 font-normal'
                : 'text-foreground font-semibold',
            )}
          >
            {n.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
            {n.body}
          </p>
        </div>

        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/25 shrink-0 mt-1.5 transition-all duration-200 group-hover:text-muted-foreground/60 group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

export default NotificationItem;
