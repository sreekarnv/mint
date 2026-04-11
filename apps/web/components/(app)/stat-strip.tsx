import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';

export interface StatStripProps {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: React.FC<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  loading: boolean;
}

function StatStrip({
  label,
  value,
  sub,
  icon: Icon,
  iconBg,
  iconColor,
  loading,
}: StatStripProps) {
  return (
    <div className="flex items-start gap-4 py-5 px-6 bg-white rounded-2xl border border-border/60 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div
        className={cn(
          'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
          iconBg,
        )}
      >
        <Icon className={cn('h-4.5 w-4.5', iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/55 mb-1.5">
          {label}
        </p>
        {loading ? (
          <Skeleton className="h-7 w-28 mb-1" />
        ) : (
          <p
            className="text-2xl font-semibold leading-none tabular-nums text-foreground"
            style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
          >
            {value}
          </p>
        )}
        {sub && (
          <p className="text-[11px] text-muted-foreground mt-1.5">{sub}</p>
        )}
      </div>
    </div>
  );
}

export default StatStrip;
