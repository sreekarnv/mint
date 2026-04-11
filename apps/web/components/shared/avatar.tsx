import { cn } from '@/lib/utils';

const colors = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
];

export function UserAvatar({
  id,
  size = 'md',
  className,
}: {
  id: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const initials = id.slice(0, 2).toUpperCase();
  const color = colors[id.charCodeAt(0) % colors.length];
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center shrink-0 font-semibold',
        color,
        size === 'sm' && 'h-8 w-8 text-xs',
        size === 'md' && 'h-10 w-10 text-sm',
        size === 'lg' && 'h-12 w-12 text-base',
        className,
      )}
    >
      {initials}
    </div>
  );
}
