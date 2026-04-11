'use client';

import { ActionDialog } from '@/components/admin/fraud/action-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { adminApi, type FraudQueueItem } from '@/lib/api/admin';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, ChevronRight, RefreshCw, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function AdminFraudPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'queue' | 'manual'>('queue');
  const [caseId, setCaseId] = useState('');
  const [selectedCase, setSelectedCase] = useState<FraudQueueItem | null>(null);

  const { data: queue, isLoading: queueLoading, refetch: refetchQueue } = useQuery({
    queryKey: queryKeys.admin.fraudQueue(),
    queryFn: () => adminApi.fraud.listQueue(),
    enabled: tab === 'queue',
  });

  const activeCaseId = tab === 'queue' ? selectedCase?.caseId : caseId;

  const approveMutation = useMutation({
    mutationFn: (data: { caseId: string; notes: string }) =>
      adminApi.fraud.approve(data.caseId, { notes: data.notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.fraudQueue() });
      setSelectedCase(null);
      setCaseId('');
      toast.success('Fraud case approved — transaction allowed');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const blockMutation = useMutation({
    mutationFn: (data: { caseId: string; notes: string }) =>
      adminApi.fraud.block(data.caseId, { notes: data.notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.fraudQueue() });
      setSelectedCase(null);
      setCaseId('');
      toast.success('Fraud case blocked — transaction voided');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const isPending = approveMutation.isPending || blockMutation.isPending;

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Fraud Review"
        description="Review and action fraud cases flagged for manual decision"
      />

      <div className="flex gap-2">
        <Button
          variant={tab === 'queue' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setTab('queue'); setCaseId(''); }}
        >
          Review Queue
          {queue && queue.total > 0 && (
            <span className="ml-2 bg-background text-foreground text-xs rounded-full px-1.5 py-0.5">
              {queue.total}
            </span>
          )}
        </Button>
        <Button
          variant={tab === 'manual' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setTab('manual'); setSelectedCase(null); }}
        >
          Manual Entry
        </Button>
      </div>

      {tab === 'queue' && (
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Pending Review</CardTitle>
              <CardDescription>
                {queue
                  ? `${queue.total} case${queue.total !== 1 ? 's' : ''} awaiting review`
                  : 'Loading…'}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => refetchQueue()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {queueLoading && (
              <div className="p-4 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}
            {queue?.items && queue.items.length === 0 && (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                No cases pending review.
              </p>
            )}
            {queue?.items && queue.items.length > 0 && (
              <div className="divide-y divide-border">
                {queue.items.map((item) => (
                  <button
                    key={item.caseId}
                    onClick={() => setSelectedCase(item)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 text-left text-sm hover:bg-accent transition-colors',
                      selectedCase?.caseId === item.caseId && 'bg-accent',
                    )}
                  >
                    <div className="space-y-0.5">
                      <p className="font-mono text-xs">{item.transactionId}</p>
                      <p className="text-xs text-muted-foreground">
                        User: {item.userId}
                        <span className="ml-3">
                          Score: <span className="font-medium text-foreground">{item.score}</span>
                        </span>
                      </p>
                      {item.rulesFired.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-1">
                          {item.rulesFired.map((r) => (
                            <Badge key={r} variant="outline" className="text-xs py-0">
                              {r}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'manual' && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Case ID</CardTitle>
            <CardDescription>Enter the fraud case ID to approve or block</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              placeholder="Enter fraud case ID"
              className="font-mono"
            />
          </CardContent>
        </Card>
      )}

      {activeCaseId && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Actions</CardTitle>
            {selectedCase && tab === 'queue' && (
              <CardDescription className="font-mono text-xs">
                {selectedCase.transactionId}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground">Case ID</p>
              <p className="text-sm font-mono mt-0.5">{activeCaseId}</p>
              {selectedCase && (
                <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                  <span>Score: <span className="text-foreground font-medium">{selectedCase.score}</span></span>
                  <span>Rules: <span className="text-foreground">{selectedCase.rulesFired.join(', ') || 'none'}</span></span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ActionDialog
                title="Approve Case"
                description="This will mark the transaction as legitimate and allow it to proceed."
                label="Notes (optional)"
                placeholder="Verified with customer..."
                confirmLabel="Approve"
                confirmVariant="default"
                icon={<CheckCircle className="h-4 w-4 mr-2" />}
                triggerLabel="Approve"
                triggerVariant="default"
                loading={approveMutation.isPending}
                disabled={isPending}
                onSubmit={(notes) => approveMutation.mutate({ caseId: activeCaseId, notes })}
              />
              <ActionDialog
                title="Block Case"
                description="This will confirm the fraud and void the transaction. This cannot be undone."
                label="Notes (optional)"
                placeholder="Confirmed fraudulent activity..."
                confirmLabel="Block & Void"
                confirmVariant="destructive"
                icon={<XCircle className="h-4 w-4 mr-2" />}
                triggerLabel="Block"
                triggerVariant="destructive"
                loading={blockMutation.isPending}
                disabled={isPending}
                onSubmit={(notes) => blockMutation.mutate({ caseId: activeCaseId, notes })}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
