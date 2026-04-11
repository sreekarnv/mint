'use client';

import { ReverseDialog } from '@/components/admin/transactions/reverse-dialog';
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
import { adminApi, type AdminTransaction } from '@/lib/api/admin';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, ChevronRight, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  COMPLETED: 'default',
  PROCESSING: 'secondary',
  PENDING: 'secondary',
  FAILED: 'destructive',
  REVERSED: 'outline',
};

export default function AdminTransactionsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'list' | 'action'>('list');
  const [txId, setTxId] = useState('');
  const [selectedTx, setSelectedTx] = useState<AdminTransaction | null>(null);
  const [userIdFilter, setUserIdFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: txList, isLoading: listLoading, refetch: refetchList } = useQuery({
    queryKey: queryKeys.admin.transactionsList({ userId: userIdFilter || undefined, status: statusFilter || undefined }),
    queryFn: () => adminApi.transactions.list({ limit: 50, userId: userIdFilter || undefined, status: statusFilter || undefined }),
    enabled: tab === 'list',
  });

  const activeTxId = tab === 'action' ? txId : selectedTx?.id ?? '';

  const reverseMutation = useMutation({
    mutationFn: (data: { id: string; reason: string }) =>
      adminApi.transactions.reverse(data.id, { reason: data.reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.transactionsList({}) });
      setSelectedTx(null);
      setTxId('');
      toast.success('Transaction reversed');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const forceCompleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.transactions.forceComplete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.transactionsList({}) });
      setSelectedTx(null);
      setTxId('');
      toast.success('Transaction force-completed');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="Transaction Management" description="Browse, reverse, or force-complete transactions" />

      <div className="flex gap-2">
        <Button variant={tab === 'list' ? 'default' : 'outline'} size="sm" onClick={() => { setTab('list'); setTxId(''); }}>
          Transaction List
        </Button>
        <Button variant={tab === 'action' ? 'default' : 'outline'} size="sm" onClick={() => { setTab('action'); setSelectedTx(null); }}>
          Manual Action
        </Button>
      </div>

      {tab === 'list' && (
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="text-sm font-semibold">All Transactions</CardTitle>
              <CardDescription>{txList ? `${txList.length} results` : 'Loading…'}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Input
                value={userIdFilter}
                onChange={(e) => setUserIdFilter(e.target.value)}
                placeholder="Filter by user ID"
                className="w-48 h-8 text-xs font-mono"
              />
              <Input
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                placeholder="Status"
                className="w-32 h-8 text-xs"
              />
              <Button variant="ghost" size="sm" onClick={() => refetchList()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {listLoading && (
              <div className="p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            )}
            {txList && txList.length === 0 && (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">No transactions found.</p>
            )}
            {txList && txList.length > 0 && (
              <div className="divide-y divide-border">
                {txList.map((tx) => (
                  <button
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 text-left text-sm hover:bg-accent transition-colors',
                      selectedTx?.id === tx.id && 'bg-accent',
                    )}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={statusVariant[tx.status] ?? 'outline'} className="text-xs">{tx.status}</Badge>
                        <span className="text-xs text-muted-foreground font-mono truncate">{tx.id}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {(tx.amount / 100).toFixed(2)} {tx.currency}
                        <span className="mx-1">·</span>
                        {tx.type}
                        {tx.description && <span className="mx-1">· {tx.description}</span>}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
                      <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'action' && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Transaction ID</CardTitle>
            <CardDescription>Enter the transaction ID to perform an action</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              value={txId}
              onChange={(e) => setTxId(e.target.value)}
              placeholder="Enter transaction ID"
              className="font-mono"
            />
          </CardContent>
        </Card>
      )}

      {activeTxId && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Actions</CardTitle>
            {selectedTx && (
              <CardDescription>
                {(selectedTx.amount / 100).toFixed(2)} {selectedTx.currency} · {selectedTx.type}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground">Transaction ID</p>
              <p className="text-sm font-mono mt-0.5">{activeTxId}</p>
              {selectedTx && (
                <div className="mt-2 flex gap-3 flex-wrap text-xs text-muted-foreground">
                  <span>Status: <Badge variant={statusVariant[selectedTx.status] ?? 'outline'} className="ml-1 text-xs">{selectedTx.status}</Badge></span>
                  <span>From: {selectedTx.senderId}</span>
                  {selectedTx.recipientId && <span>To: {selectedTx.recipientId}</span>}
                  {selectedTx.fraudScore != null && <span>Fraud score: {selectedTx.fraudScore}</span>}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <ReverseDialog
                onReverse={(reason) => reverseMutation.mutate({ id: activeTxId, reason })}
                loading={reverseMutation.isPending}
              />
              <Button
                variant="outline"
                onClick={() => forceCompleteMutation.mutate(activeTxId)}
                disabled={forceCompleteMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {forceCompleteMutation.isPending ? 'Processing…' : 'Force Complete'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
