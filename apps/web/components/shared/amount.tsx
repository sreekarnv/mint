import { cn } from '@/lib/utils';

interface AmountProps {
  cents: number;
  currency?: string;
  signed?: boolean;
  overrideColor?: string;
}

export function Amount({
  cents,
  currency = 'USD',
  signed = false,
  overrideColor,
}: AmountProps) {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  });
  const value = cents / 100;
  const formatted = formatter.format(Math.abs(value));
  const sign = signed
    ? value < 0
      ? '-'
      : value > 0
        ? '+'
        : ''
    : value < 0
      ? '-'
      : '';

  return (
    <span
      className={cn(
        !overrideColor && value < 0
          ? 'text-destructive'
          : value > 0
            ? 'text-green-700'
            : '',
        overrideColor ? overrideColor : '',
      )}
    >
      {sign}
      {formatted}
    </span>
  );
}
