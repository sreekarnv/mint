'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { adminApi, type SystemLimits } from '@/lib/api/admin';
import { queryKeys } from '@/lib/query-keys';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Settings } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const systemLimitsSchema = z.object({
  maxTransferCents: z.coerce.number().int().positive('Must be positive').optional(),
  maxTopupCents: z.coerce.number().int().positive('Must be positive').optional(),
  dailyLimitCents: z.coerce.number().int().positive('Must be positive').optional(),
  monthlyLimitCents: z.coerce.number().int().positive('Must be positive').optional(),
});
type SystemLimitsForm = z.infer<typeof systemLimitsSchema>;

export default function AdminSystemPage() {
  const queryClient = useQueryClient();

  const { data: limits, isLoading } = useQuery({
    queryKey: queryKeys.admin.systemLimits(),
    queryFn: () => adminApi.system.getLimits(),
  });

  const form = useForm<SystemLimitsForm>({
    resolver: zodResolver(systemLimitsSchema),
    defaultValues: {
      maxTransferCents: undefined,
      maxTopupCents: undefined,
      dailyLimitCents: undefined,
      monthlyLimitCents: undefined,
    },
  });

  useEffect(() => {
    if (limits) {
      form.reset({
        maxTransferCents: limits.maxTransferCents,
        maxTopupCents: limits.maxTopupCents,
        dailyLimitCents: limits.dailyLimitCents,
        monthlyLimitCents: limits.monthlyLimitCents,
      });
    }
  }, [limits, form]);

  const updateMutation = useMutation({
    mutationFn: (body: Partial<SystemLimits>) => adminApi.system.patchLimits(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.systemLimits() });
      toast.success('Limits updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(values: SystemLimitsForm) {
    const patch: Partial<SystemLimits> = {};
    if (values.maxTransferCents != null) patch.maxTransferCents = values.maxTransferCents;
    if (values.maxTopupCents != null) patch.maxTopupCents = values.maxTopupCents;
    if (values.dailyLimitCents != null) patch.dailyLimitCents = values.dailyLimitCents;
    if (values.monthlyLimitCents != null) patch.monthlyLimitCents = values.monthlyLimitCents;
    updateMutation.mutate(patch);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="System Limits"
        description="Configure global transaction and spending limits"
      />

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            <Settings className="h-4 w-4 inline mr-1.5" />
            Current Limits
          </CardTitle>
          <CardDescription>View and update system-wide limits</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="maxTransferCents"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Transfer (cents)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxTopupCents"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Topup (cents)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dailyLimitCents"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Daily Limit (cents)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="monthlyLimitCents"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Limit (cents)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="pt-4">
                  <Button type="submit" disabled={updateMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
