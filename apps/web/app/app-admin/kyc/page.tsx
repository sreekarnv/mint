'use client';

import { ProfileReviewPanel } from '@/components/admin/kyc/profile-review-panel';
import { PageHeader } from '@/components/shared/page-header';
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
import { adminApi, type KycQueueItem, type UserSearchResult } from '@/lib/api/admin';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, RefreshCw, Search } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function AdminKycPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'queue' | 'lookup'>('queue');
  const [email, setEmail] = useState('');
  const [searchSubmitted, setSearchSubmitted] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [selectedQueued, setSelectedQueued] = useState<KycQueueItem | null>(null);

  const { data: queue, isLoading: queueLoading, refetch: refetchQueue } = useQuery({
    queryKey: queryKeys.admin.kycQueue(),
    queryFn: () => adminApi.kyc.listQueue(),
    enabled: tab === 'queue',
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: queryKeys.admin.userSearch(email),
    queryFn: () => adminApi.user.search(email),
    enabled: searchSubmitted && email.length >= 2,
  });

  const activeUserId =
    tab === 'lookup' ? (selectedUser?.id ?? '') : (selectedQueued?.userId ?? '');

  const { data: kycProfile, isLoading: kycLoading } = useQuery({
    queryKey: queryKeys.admin.kycProfile(activeUserId),
    queryFn: () => adminApi.kyc.getByUserId(activeUserId),
    enabled: !!activeUserId,
  });

  const { data: userProfile } = useQuery({
    queryKey: queryKeys.admin.user(activeUserId),
    queryFn: () => adminApi.user.get(activeUserId),
    enabled: !!activeUserId,
  });

  const approveMutation = useMutation({
    mutationFn: (profileId: string) => adminApi.kyc.approve(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.kycQueue() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.kycProfile(activeUserId) });
      setSelectedQueued(null);
      toast.success('KYC approved');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: (data: { profileId: string; reason: string }) =>
      adminApi.kyc.reject(data.profileId, { reason: data.reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.kycQueue() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.kycProfile(activeUserId) });
      setSelectedQueued(null);
      toast.success('KYC rejected');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const showPanel = tab === 'lookup' ? !!selectedUser : !!selectedQueued;

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="KYC Management"
        description="Review pending submissions or look up a specific user"
      />

      <div className="flex gap-2">
        <Button
          variant={tab === 'queue' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setTab('queue'); setSelectedUser(null); }}
        >
          Pending Queue
          {queue && queue.total > 0 && (
            <span className="ml-2 bg-background text-foreground text-xs rounded-full px-1.5 py-0.5">
              {queue.total}
            </span>
          )}
        </Button>
        <Button
          variant={tab === 'lookup' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setTab('lookup'); setSelectedQueued(null); }}
        >
          User Lookup
        </Button>
      </div>

      {tab === 'queue' && (
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Pending Review</CardTitle>
              <CardDescription>
                {queue
                  ? `${queue.total} profile${queue.total !== 1 ? 's' : ''} awaiting review`
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
                <Skeleton className="h-10 w-full" />
              </div>
            )}
            {queue?.items && queue.items.length === 0 && (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                No pending profiles.
              </p>
            )}
            {queue?.items && queue.items.length > 0 && (
              <div className="divide-y divide-border">
                {queue.items.map((item) => (
                  <button
                    key={item.profileId}
                    onClick={() => setSelectedQueued(item)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 text-left text-sm hover:bg-accent transition-colors',
                      selectedQueued?.profileId === item.profileId && 'bg-accent',
                    )}
                  >
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">{item.userId}</p>
                      <p className="text-xs mt-0.5">
                        Tier: <span className="font-medium">{item.tier}</span>
                        {item.submittedAt && (
                          <span className="ml-3 text-muted-foreground">
                            {new Date(item.submittedAt).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'lookup' && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Find User</CardTitle>
            <CardDescription>Search by email address</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => { e.preventDefault(); setSelectedUser(null); setSearchSubmitted(true); }}
              className="flex gap-2"
            >
              <Input
                value={email}
                onChange={(e) => { setEmail(e.target.value); setSearchSubmitted(false); setSelectedUser(null); }}
                placeholder="user@example.com"
                type="email"
                className="flex-1"
              />
              <Button type="submit" disabled={email.length < 2}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </form>
            {searchLoading && <Skeleton className="h-10 w-full mt-3" />}
            {searchResults && searchResults.length === 0 && (
              <p className="mt-3 text-sm text-muted-foreground">No users found.</p>
            )}
            {searchResults && searchResults.length > 0 && (
              <div className="mt-3 border border-border rounded-md divide-y divide-border">
                {searchResults.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-accent transition-colors',
                      selectedUser?.id === u.id && 'bg-accent',
                    )}
                  >
                    <div>
                      <p className="font-medium">{u.email}</p>
                      {u.name && <p className="text-xs text-muted-foreground">{u.name}</p>}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showPanel && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">KYC Review</CardTitle>
          </CardHeader>
          <CardContent>
            {kycLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : kycProfile ? (
              <ProfileReviewPanel
                profile={kycProfile}
                userProfile={userProfile}
                userIdentity={tab === 'lookup' ? selectedUser : null}
                onApprove={() => approveMutation.mutate(kycProfile.profileId)}
                onReject={(reason) =>
                  rejectMutation.mutate({ profileId: kycProfile.profileId, reason })
                }
                approving={approveMutation.isPending}
                rejecting={rejectMutation.isPending}
              />
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
