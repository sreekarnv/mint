'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { socialApi } from '@/lib/api/social';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, SplitSquareHorizontal } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { SplitForm } from './split-form';
import { SplitRow } from './split-row';

export function SplitsTab() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: splits, isLoading } = useQuery({
    queryKey: queryKeys.social.splits(),
    queryFn: () => socialApi.splits.list(),
  });

  const createMutation = useMutation({
    mutationFn: (body: {
      title: string;
      totalCents: number;
      participants: { userId: string; amountCents: number }[];
    }) => socialApi.splits.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.social.splits() });
      setCreateOpen(false);
      toast.success('Bill split created');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Split Bill
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : !splits?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <SplitSquareHorizontal className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No bill splits</p>
          <p className="text-xs text-muted-foreground mt-1">
            Split a bill with friends to share costs
          </p>
          <Button size="sm" className="mt-4" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Create a split
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {splits.map((split) => (
            <SplitRow
              key={split.id}
              split={split}
              currentUserId={user?.id}
              onPaySuccess={() =>
                queryClient.invalidateQueries({ queryKey: queryKeys.social.splits() })
              }
            />
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Split a Bill</DialogTitle>
            <DialogDescription>Divide an expense between multiple people</DialogDescription>
          </DialogHeader>
          <SplitForm
            onSubmit={(data) => createMutation.mutate(data)}
            loading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
