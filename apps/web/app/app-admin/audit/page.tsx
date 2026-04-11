'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { queryKeys } from '@/lib/query-keys';
import { PageHeader } from '@/components/shared/page-header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw } from 'lucide-react';

export default function AdminAuditPage() {
  const [actorId, setActorId] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const params = {
    actorId: actorId || undefined,
    action: action || undefined,
    page,
    pageSize: 50,
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: queryKeys.admin.auditLog({
      actorId: actorId || undefined,
      action: action || undefined,
      page: String(page),
    }),
    queryFn: () => adminApi.audit.list(params),
    enabled: submitted,
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSubmitted(true);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="Audit Log" description="Immutable record of all admin actions" />

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2 flex-wrap">
            <Input
              value={actorId}
              onChange={(e) => setActorId(e.target.value)}
              placeholder="Actor user ID"
              className="flex-1 min-w-48 font-mono text-xs"
            />
            <Input
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="Action (e.g. admin.kyc_approved)"
              className="flex-1 min-w-48 text-xs"
            />
            <Button type="submit">Search</Button>
            {submitted && (
              <Button type="button" variant="ghost" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {submitted && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Results</CardTitle>
            {data && (
              <CardDescription>
                {data.total} total · page {data.page} of {data.totalPages}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {isLoading && (
              <div className="p-4 space-y-2">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            )}
            {data && data.entries.length === 0 && (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">No audit events found.</p>
            )}
            {data && data.entries.length > 0 && (
              <div className="divide-y divide-border">
                {data.entries.map((entry) => (
                  <div key={entry.id} className="px-4 py-3 text-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-xs">{entry.action}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          {entry.actorId} · {entry.service}
                          {entry.resourceType && <span> · {entry.resourceType}</span>}
                        </p>
                        <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap break-all font-mono bg-muted/30 rounded px-2 py-1 max-h-24 overflow-y-auto">
                          {JSON.stringify(entry.afterState, null, 2)}
                        </pre>
                      </div>
                      <p className="text-xs text-muted-foreground shrink-0">
                        {new Date(entry.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {data && data.totalPages > 1 && (
              <div className="flex gap-2 justify-center p-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground self-center">
                  Page {data.page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
