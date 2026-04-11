import { cn } from '@/lib/utils';
import { CheckCircle2, Lock } from 'lucide-react';
import { Tier } from './constants';

interface KycVerificationCardProps {
  currentTier: Tier;
  currentIndex: number;
  tier: string;
  tierIndex: number;
}

function KycVerificationCard({
  currentTier: t,
  currentIndex: i,
  tier,
  tierIndex,
}: KycVerificationCardProps) {
  const Icon = t.icon;
  const isCurrent = t.key === tier;
  const isCompleted = i < tierIndex;
  const isNext = i === tierIndex + 1;
  const isLocked = i > tierIndex + 1;

  return (
    <>
      <div
        className={cn(
          'relative rounded-2xl border-2 p-5 transition-all',
          isCompleted && 'border-emerald-200 bg-emerald-50/30',
          isCurrent && `${t.activeBorder} bg-card shadow-sm`,
          isLocked && 'border-border bg-muted/20 opacity-60',
          isNext && 'border-dashed border-border bg-card',
        )}
      >
        {isCurrent && (
          <span className="absolute -top-2.5 left-4 bg-card border border-border text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 py-0.5 rounded-full">
            Current
          </span>
        )}
        {isCompleted && (
          <span className="absolute -top-2.5 left-4 bg-emerald-500 text-white text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full">
            Completed
          </span>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div
            className={cn(
              'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
              isCompleted ? 'bg-emerald-100' : t.bg,
            )}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : isLocked ? (
              <Lock className="h-5 w-5 text-zinc-400" />
            ) : (
              <Icon className={cn('h-5 w-5', t.color)} />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold">{t.label}</p>
            {t.requirement && (
              <p className="text-[11px] text-muted-foreground">
                Requires: {t.requirement}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 mb-4">
          {[
            { label: 'Per txn', value: t.limits.perTxn },
            { label: 'Daily', value: t.limits.daily },
            { label: 'Monthly', value: t.limits.monthly },
          ].map(({ label, value }) => (
            <div key={label} className="bg-muted/60 rounded-lg p-2 text-center">
              <p className="text-[10px] text-muted-foreground">{label}</p>
              <p className="text-xs font-semibold tabular-nums mt-0.5">
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          {t.features.map((f) => (
            <div key={f} className="flex items-center gap-2">
              <CheckCircle2
                className={cn(
                  'h-3.5 w-3.5 shrink-0',
                  isCompleted || isCurrent
                    ? 'text-emerald-500'
                    : 'text-zinc-300',
                )}
              />
              <p className="text-xs text-muted-foreground">{f}</p>
            </div>
          ))}
          {t.locked.map((f) => (
            <div key={f} className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 shrink-0 text-zinc-300" />
              <p className="text-xs text-muted-foreground/60 line-through">
                {f}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default KycVerificationCard;
