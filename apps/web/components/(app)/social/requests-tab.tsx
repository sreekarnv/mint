'use client';

import { CurrencyInput } from '@/components/shared/currency-input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { type UserSearchResult } from '@/lib/api/auth';
import { socialApi, type MoneyRequest } from '@/lib/api/social';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/lib/stores/auth.store';
import { moneyRequestSchema, type MoneyRequestInput } from '@/lib/validators/social.schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowUpRight, Loader2, Plus, Receipt } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { RequestCard } from './request-card';
import { UserSearchInput } from './user-search-input';

export function RequestsTab() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [createOpen, setCreateOpen] = useState(false);
  const [recipient, setRecipient] = useState<UserSearchResult | null>(null);

  const form = useForm<MoneyRequestInput>({
    resolver: zodResolver(moneyRequestSchema),
    defaultValues: { recipientId: '', amount: 0, note: '' },
  });

  const { data: requests, isLoading } = useQuery({
    queryKey: queryKeys.social.requests(),
    queryFn: () => socialApi.requests.list(),
  });

  const createMutation = useMutation({
    mutationFn: (body: { recipientId: string; amount: number; note?: string }) =>
      socialApi.requests.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.social.requests() });
      setCreateOpen(false);
      setRecipient(null);
      form.reset();
      toast.success('Request sent');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const acceptMutation = useMutation({
    mutationFn: (req: MoneyRequest) => socialApi.requests.accept(req.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.social.requests() });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.root() });
      toast.success('Payment sent');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const declineMutation = useMutation({
    mutationFn: (id: string) => socialApi.requests.decline(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.social.requests() });
      toast.success('Request declined');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => socialApi.requests.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.social.requests() });
      toast.success('Request cancelled');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const incoming = requests?.filter((r) => r.recipientId === user?.id) ?? [];
  const outgoing = requests?.filter((r) => r.requesterId === user?.id) ?? [];
  const pendingIncoming = incoming.filter((r) => r.status === 'PENDING');

  function handleDialogOpen(open: boolean) {
    setCreateOpen(open);
    if (!open) {
      setRecipient(null);
      form.reset();
    }
  }

  function handleSubmit(values: MoneyRequestInput) {
    createMutation.mutate({
      recipientId: values.recipientId,
      amount: values.amount,
      note: values.note || undefined,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {pendingIncoming.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-0.5 text-xs font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {pendingIncoming.length} pending
            </span>
          )}
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Request Money
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : !requests?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <Receipt className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No money requests</p>
          <p className="text-xs text-muted-foreground mt-1">
            Request money from someone to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-semibold">Incoming</p>
              <span className="text-xs text-muted-foreground">({incoming.length})</span>
            </div>
            {incoming.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No incoming requests
              </p>
            ) : (
              <div className="space-y-2">
                {incoming.map((req) => (
                  <RequestCard
                    key={req.id}
                    request={req}
                    isIncoming
                    onAccept={() => acceptMutation.mutate(req)}
                    onDecline={() => declineMutation.mutate(req.id)}
                    acceptPending={acceptMutation.isPending}
                    declinePending={declineMutation.isPending}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-semibold">Outgoing</p>
              <span className="text-xs text-muted-foreground">({outgoing.length})</span>
            </div>
            {outgoing.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No outgoing requests
              </p>
            ) : (
              <div className="space-y-2">
                {outgoing.map((req) => (
                  <RequestCard
                    key={req.id}
                    request={req}
                    isIncoming={false}
                    onCancel={() => cancelMutation.mutate(req.id)}
                    cancelPending={cancelMutation.isPending}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={handleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Money</DialogTitle>
            <DialogDescription>Send a payment request to another user</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <UserSearchInput
                label="Request from"
                onSelect={(u) => {
                  setRecipient(u);
                  form.setValue('recipientId', u.id, { shouldValidate: true });
                }}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <CurrencyInput
                      label="Amount"
                      value={field.value}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note (optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="What's it for?" rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={createMutation.isPending || !recipient}
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {createMutation.isPending ? 'Sending…' : 'Send Request'}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
