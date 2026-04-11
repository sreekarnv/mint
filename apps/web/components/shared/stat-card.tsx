import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: { value: number; positive: boolean };
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({
  label,
  value,
  trend,
  icon: Icon,
  className,
}: StatCardProps) {
  return (
    <Card className={cn('border-border', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-start justify-between">
        <div>
          <div className="text-2xl font-semibold text-foreground">{value}</div>
          {trend && (
            <p
              className={cn(
                'text-xs mt-1',
                trend.positive ? 'text-green-600' : 'text-destructive',
              )}
            >
              {trend.positive ? '+' : ''}
              {trend.value}%
            </p>
          )}
        </div>
        {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
      </CardContent>
    </Card>
  );
}
