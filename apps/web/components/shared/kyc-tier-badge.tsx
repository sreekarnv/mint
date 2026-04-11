import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { KycTier } from '@/lib/api/kyc';

interface KycTierBadgeProps {
  tier: KycTier;
}

const tierConfig: Record<KycTier, { label: string; className: string }> = {
  UNVERIFIED: {
    label: 'Unverified',
    className: 'bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-100',
  },
  BASIC: {
    label: 'Basic',
    className: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-50',
  },
  VERIFIED: {
    label: 'Verified',
    className: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-50',
  },
};

export function KycTierBadge({ tier }: KycTierBadgeProps) {
  const config = tierConfig[tier] ?? tierConfig.UNVERIFIED;
  return (
    <Badge
      className={cn('border text-xs font-medium px-2.5 py-1', config.className)}
    >
      {config.label}
    </Badge>
  );
}
