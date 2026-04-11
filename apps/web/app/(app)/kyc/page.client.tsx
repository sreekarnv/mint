'use client';

import BasicUpgradeSection from '@/components/(app)/kyc/basic-upgrade-section';
import { statusBadge, TIERS } from '@/components/(app)/kyc/constants';
import KycVerificationCard from '@/components/(app)/kyc/kyc-verification-card';
import { fmt } from '@/components/(app)/kyc/utils';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { authApi } from '@/lib/api/auth';
import { kycApi } from '@/lib/api/kyc';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/lib/stores/auth.store';
import { cn } from '@/lib/utils';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  CheckCircle2,
  Clock,
  Loader2,
  MailCheck,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export function KycClient() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  const [
    { data: profile, isLoading: profileLoading },
    { data: limits, isLoading: limitsLoading },
  ] = useQueries({
    queries: [
      {
        queryKey: queryKeys.kyc.profile(),
        queryFn: kycApi.getProfile,
      },
      {
        queryKey: queryKeys.kyc.limits(),
        queryFn: kycApi.getLimits,
      },
    ],
  });

  const submitMutation = useMutation({
    mutationFn: kycApi.submit,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kyc.profile() });
      queryClient.invalidateQueries({ queryKey: queryKeys.kyc.limits() });
      try {
        const u = await authApi.me();
        setUser(u);
      } catch {}
      toast.success(
        "Submitted for review. We'll notify you when it's processed.",
      );
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function refreshProfile() {
    queryClient.invalidateQueries({ queryKey: queryKeys.kyc.profile() });
  }

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const tier = profile?.tier ?? 'UNVERIFIED';
  const status = profile?.status ?? 'NONE';
  const tierIndex = TIERS.findIndex((t) => t.key === tier);

  const uploadedTypes = new Set(
    (profile?.kycDocuments ?? []).map((d) => d.type),
  );
  const hasIdDoc =
    uploadedTypes.has('PASSPORT') || uploadedTypes.has('DRIVERS_LICENSE');
  const hasSelfie = uploadedTypes.has('SELFIE');

  const canSubmit =
    tier === 'BASIC' && status !== 'PENDING_REVIEW' && hasIdDoc && hasSelfie;

  const isPending = status === 'PENDING_REVIEW';
  const isVerified = tier === 'VERIFIED';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Identity Verification
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete verification steps to unlock higher limits and full platform
          access.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TIERS.map((t, i) => {
          return (
            <KycVerificationCard
              key={`${i}-${t.label}`}
              tier={tier}
              tierIndex={tierIndex}
              currentTier={t}
              currentIndex={i}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Current Status
              </CardTitle>
              <Badge variant={statusBadge[status].variant}>
                {statusBadge[status].label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {status === 'REJECTED' && profile?.rejectionReason && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{profile.rejectionReason}</p>
              </div>
            )}
            {isPending && (
              <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2.5">
                <Clock className="h-4 w-4 shrink-0" />
                <p>Under review — usually takes 1–2 business days.</p>
              </div>
            )}
            {isVerified && (
              <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <p>Your identity is fully verified. All limits unlocked.</p>
              </div>
            )}
            {tier === 'UNVERIFIED' && !isPending && (
              <p className="text-sm text-muted-foreground">
                Verify your email to automatically reach Basic tier and unlock
                transfers.
              </p>
            )}
            {tier === 'BASIC' &&
              !isPending &&
              !isVerified &&
              status !== 'REJECTED' && (
                <p className="text-sm text-muted-foreground">
                  Upload a government-issued ID and selfie to reach Verified
                  tier.
                </p>
              )}
            {profile?.verifiedAt && (
              <p className="text-xs text-muted-foreground">
                Verified on{' '}
                {format(new Date(profile.verifiedAt), 'MMM d, yyyy')}
              </p>
            )}

            {!limitsLoading && limits && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Your active limits
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Per txn', value: limits.perTxnCents },
                    { label: 'Daily', value: limits.dailyCents },
                    { label: 'Monthly', value: limits.monthlyCents },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="bg-muted/50 rounded-lg p-2.5 text-center"
                    >
                      <p className="text-[10px] text-muted-foreground">
                        {label}
                      </p>
                      <p className="text-xs font-semibold tabular-nums mt-0.5">
                        {fmt(value, limits.limitsCurrency)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {isVerified ? null : tier === 'UNVERIFIED' ? (
          <Card className="border-amber-200 bg-amber-50/30">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-3 h-full">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <MailCheck className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  Verify your email first
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Once your email is verified your account automatically
                  upgrades to Basic tier — no documents needed.
                </p>
              </div>
              {user?.email_verified === false && (
                <Link
                  href="/dashboard"
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'sm' }),
                    'border-amber-300 text-amber-700 hover:bg-amber-100',
                  )}
                >
                  Resend verification email
                </Link>
              )}
            </CardContent>
          </Card>
        ) : isPending ? (
          <Card className="border-amber-200 bg-amber-50/30">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-3 h-full">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  Review in progress
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  We'll notify you once your documents are verified. This
                  usually takes 1–2 business days.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" />
                Upgrade to Verified
              </CardTitle>
              <CardDescription>
                Upload a government-issued ID and a selfie holding it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <BasicUpgradeSection
                uploadedTypes={uploadedTypes}
                onUploaded={refreshProfile}
              />
              <div className="pt-1">
                <Button
                  onClick={() => submitMutation.mutate()}
                  disabled={!canSubmit || submitMutation.isPending}
                  className="w-full"
                >
                  {submitMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ShieldAlert className="h-4 w-4 mr-2" />
                  )}
                  {submitMutation.isPending
                    ? 'Submitting…'
                    : 'Submit for Review'}
                </Button>
                {!canSubmit && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Upload your ID document and selfie to continue.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
