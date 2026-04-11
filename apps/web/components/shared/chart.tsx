import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ChartHeaderProps {
  title: string;
  action?: React.ReactNode;
  description?: string;
}

export function ChartHeader({ title, action, description }: ChartHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="h-px w-4 bg-primary/40" />
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">
            {title}
          </h2>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

export interface ChartProps extends React.ComponentProps<'div'> {
  header: React.ReactNode;
  children?: React.ReactNode;
}

export function Chart({ header, children, className, ...props }: ChartProps) {
  return (
    <>
      <Card
        className={cn(
          'ring-0 rounded-2xl border border-border/5 shadow-sm bg-white p-6',
          className,
        )}
        {...props}
      >
        <CardContent>
          {header}
          {children}
        </CardContent>
      </Card>
    </>
  );
}
