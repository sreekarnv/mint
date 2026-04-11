import {
  CATEGORIES,
  CATEGORY_META,
  categoryLabel,
} from '@/components/(app)/analytics/constants';
import { Amount } from '@/components/shared/amount';
import { Chart, ChartHeader } from '@/components/shared/chart';
import { CurrencyInput } from '@/components/shared/currency-input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { analyticsApi, Budget, MonthlyInsights } from '@/lib/api/analytics';
import { Category } from '@/lib/api/transactions';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface BudgetChartProps extends React.ComponentProps<'div'> {
  budgets?: Budget[];
  budgetsLoading: boolean;
  insights?: MonthlyInsights;
}

function BudgetChart({
  budgets,
  budgetsLoading,
  insights,
  ...props
}: BudgetChartProps) {
  const queryClient = useQueryClient();
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [newLimit, setNewLimit] = useState(0);
  const [newCategory, setNewCategory] = useState<Category>('FOOD');

  const activeBudgets = budgets?.filter((b) => b.active) ?? [];

  const createBudget = useMutation({
    mutationFn: analyticsApi.createBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.analytics.budgets(),
      });
      setBudgetOpen(false);
      setNewLimit(0);
      toast.success('Budget created');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteBudget = useMutation({
    mutationFn: analyticsApi.deleteBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.analytics.budgets(),
      });
      toast.success('Budget removed');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <>
      <Chart
        header={
          <ChartHeader
            title="Monthly Budgets"
            action={
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs px-3"
                onClick={() => setBudgetOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1.5" />
                Add budget
              </Button>
            }
          />
        }
        {...props}
      >
        {budgetsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : !activeBudgets.length ? (
          <div className="border border-dashed border-border rounded-xl py-10 text-center">
            <p className="text-sm font-medium text-foreground/60">
              No budgets set
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Add a budget to track your category spending.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeBudgets.map((b) => {
              const spent =
                insights?.categories?.find((c) => c.category === b.category)
                  ?.total ?? 0;
              const pct = Math.min(
                Math.round((spent / b.limitCents) * 100),
                100,
              );
              const over = spent > b.limitCents;
              const meta = CATEGORY_META[b.category];

              return (
                <div
                  key={b.id}
                  className={cn(
                    'relative p-4 rounded-xl border',
                    over
                      ? 'border-red-200 bg-red-50/40'
                      : 'border-border/60 bg-muted/20',
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: meta?.color ?? '#6B7280' }}
                      />
                      <p className="text-xs font-semibold text-foreground">
                        {categoryLabel(b.category)}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteBudget.mutate(b.id)}
                      disabled={deleteBudget.isPending}
                      className="text-muted-foreground/40 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  <Progress
                    value={pct}
                    className={cn(
                      'h-1.5 mb-2.5',
                      over && '[&>div]:bg-destructive',
                    )}
                    style={
                      !over
                        ? ({
                            '--progress-foreground': meta?.color,
                          } as React.CSSProperties)
                        : undefined
                    }
                  />

                  <div className="flex items-center justify-between">
                    <p
                      className={cn(
                        'text-[11px] tabular-nums font-semibold',
                        over ? 'text-destructive' : 'text-foreground/70',
                      )}
                    >
                      <Amount cents={spent} /> spent
                    </p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      of <Amount cents={b.limitCents} />
                    </p>
                  </div>

                  {over && (
                    <p className="text-[10px] text-destructive font-semibold mt-1">
                      Over budget by <Amount cents={spent - b.limitCents} />
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Chart>
      <Dialog open={budgetOpen} onOpenChange={setBudgetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Budget</DialogTitle>
            <DialogDescription>
              Set a monthly spending limit for a category.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createBudget.mutate({
                category: newCategory,
                limitCents: newLimit,
              });
            }}
            className="space-y-4 pt-1"
          >
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={newCategory}
                onValueChange={(v) => setNewCategory(v as Category)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {categoryLabel(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <CurrencyInput
              label="Monthly limit"
              value={newLimit}
              onChange={setNewLimit}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={createBudget.isPending || newLimit <= 0}
            >
              {createBudget.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Create budget
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default BudgetChart;
