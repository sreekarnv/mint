'use client';

import { FreezeDialog } from '@/components/admin/dashboard/freeze-dialog';
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
import { adminApi, type UserSearchResult } from '@/lib/api/admin';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Flame, Search, ShieldAlert, ShieldOff } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [searchSubmitted, setSearchSubmitted] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(
    null,
  );

  const {
    data: searchResults,
    isLoading: searchLoading,
    isError: searchError,
  } = useQuery({
    queryKey: queryKeys.admin.userSearch(email),
    queryFn: () => adminApi.user.search(email),
    enabled: searchSubmitted && email.length >= 2,
  });

  const {
    data: userProfile,
    isLoading: profileLoading,
  } = useQuery({
    queryKey: queryKeys.admin.user(selectedUser?.id ?? ''),
    queryFn: () => adminApi.user.get(selectedUser!.id),
    enabled: !!selectedUser,
  });

  const freezeMutation = useMutation({
    mutationFn: (data: { userId: string; reason: string }) =>
      adminApi.user.freeze(data.userId, { reason: data.reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.user(selectedUser?.id ?? ''),
      });
      toast.success('User frozen');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const unfreezeMutation = useMutation({
    mutationFn: (userId: string) => adminApi.user.unfreeze(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.user(selectedUser?.id ?? ''),
      });
      toast.success('User unfrozen');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const roleMutation = useMutation({
    mutationFn: (data: { userId: string; role: 'USER' | 'ADMIN' }) =>
      adminApi.user.updateRole(data.userId, data.role),
    onSuccess: (_, { role }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.user(selectedUser?.id ?? ''),
      });
      toast.success(`Role updated to ${role}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSelectedUser(null);
    setSearchSubmitted(true);
  }

  function handleSelectUser(user: UserSearchResult) {
    setSelectedUser(user);
    setSearchSubmitted(false);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="User Management"
        description="Search users and manage their accounts"
      />

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Find User</CardTitle>
          <CardDescription>Search by email address</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setSearchSubmitted(false);
                setSelectedUser(null);
              }}
              placeholder="user@example.com"
              type="email"
              className="flex-1"
            />
            <Button type="submit" disabled={email.length < 2}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>

          {searchLoading && (
            <div className="mt-3 space-y-1">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}

          {searchError && (
            <p className="mt-3 text-sm text-destructive">Search failed.</p>
          )}

          {searchResults && searchResults.length === 0 && (
            <p className="mt-3 text-sm text-muted-foreground">No users found.</p>
          )}

          {searchResults && searchResults.length > 0 && (
            <div className="mt-3 border border-border rounded-md divide-y divide-border">
              {searchResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleSelectUser(u)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-accent transition-colors',
                    selectedUser?.id === u.id && 'bg-accent',
                  )}
                >
                  <div>
                    <p className="font-medium">{u.email}</p>
                    {u.name && (
                      <p className="text-xs text-muted-foreground">{u.name}</p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedUser && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              {selectedUser.name ?? selectedUser.email}
            </CardTitle>
            <CardDescription className="font-mono text-xs">
              {selectedUser.id}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profileLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : userProfile ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="text-sm">{selectedUser.name ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">KYC Tier</p>
                    <Badge variant="secondary">{userProfile.kyc.tier}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Wallet Status
                    </p>
                    <Badge
                      variant={
                        userProfile.wallet.status === 'active'
                          ? 'default'
                          : 'destructive'
                      }
                    >
                      {userProfile.wallet.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className="text-sm font-medium">
                      {(userProfile.wallet.balance / 100).toFixed(2)}{' '}
                      {userProfile.wallet.currency}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  {userProfile.wallet.status === 'active' ? (
                    <FreezeDialog
                      onSubmit={(reason) =>
                        freezeMutation.mutate({
                          userId: selectedUser.id,
                          reason,
                        })
                      }
                      loading={freezeMutation.isPending}
                    />
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => unfreezeMutation.mutate(selectedUser.id)}
                      disabled={unfreezeMutation.isPending}
                    >
                      <Flame className="h-4 w-4 mr-2" />
                      {unfreezeMutation.isPending ? 'Unfreezing...' : 'Unfreeze'}
                    </Button>
                  )}
                  {userProfile.role === 'ADMIN' ? (
                    <Button
                      variant="outline"
                      onClick={() =>
                        roleMutation.mutate({ userId: selectedUser.id, role: 'USER' })
                      }
                      disabled={roleMutation.isPending}
                    >
                      <ShieldOff className="h-4 w-4 mr-2" />
                      {roleMutation.isPending ? 'Updating...' : 'Demote to User'}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() =>
                        roleMutation.mutate({ userId: selectedUser.id, role: 'ADMIN' })
                      }
                      disabled={roleMutation.isPending}
                    >
                      <ShieldAlert className="h-4 w-4 mr-2" />
                      {roleMutation.isPending ? 'Updating...' : 'Promote to Admin'}
                    </Button>
                  )}
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
