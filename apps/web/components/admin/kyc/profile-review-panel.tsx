'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  type AdminKycProfile,
  type AdminUserProfile,
  type UserSearchResult,
} from '@/lib/api/admin';
import {
  Clock,
  CreditCard,
  FileText,
  ShieldCheck,
  User,
  Wallet,
} from 'lucide-react';
import { RejectDialog } from './reject-dialog';

const kycStatusVariant: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  NONE: 'outline',
  PENDING_REVIEW: 'secondary',
  APPROVED: 'default',
  REJECTED: 'destructive',
};

const docTypeLabel: Record<string, string> = {
  PASSPORT: 'Passport',
  DRIVERS_LICENSE: "Driver's License",
  NATIONAL_ID: 'National ID',
  SELFIE: 'Selfie w/ ID',
  UTILITY_BILL: 'Utility Bill',
  OTHER: 'Other',
};

const docTypeIcon: Record<string, React.ReactNode> = {
  PASSPORT: <CreditCard className="h-4 w-4" />,
  DRIVERS_LICENSE: <CreditCard className="h-4 w-4" />,
  NATIONAL_ID: <CreditCard className="h-4 w-4" />,
  SELFIE: <User className="h-4 w-4" />,
  UTILITY_BILL: <FileText className="h-4 w-4" />,
  OTHER: <FileText className="h-4 w-4" />,
};

export function ProfileReviewPanel({
  profile,
  userProfile,
  userIdentity,
  onApprove,
  onReject,
  approving,
  rejecting,
}: {
  profile: AdminKycProfile;
  userProfile: AdminUserProfile | undefined;
  userIdentity: UserSearchResult | null;
  onApprove: () => void;
  onReject: (reason: string) => void;
  approving: boolean;
  rejecting: boolean;
}) {
  const email = userIdentity?.email ?? userProfile?.email ?? null;
  const name = userIdentity?.name ?? userProfile?.name ?? null;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <User className="h-3.5 w-3.5" />
          <span>User identity</span>
        </div>
        {email ? (
          <p className="text-sm font-medium">{email}</p>
        ) : (
          <p className="text-xs font-mono text-muted-foreground">
            {profile.profileId}
          </p>
        )}
        {name && <p className="text-xs text-muted-foreground">{name}</p>}
        <p className="text-xs font-mono text-muted-foreground/60">
          {profile.profileId}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border px-3 py-2">
          <p className="text-xs text-muted-foreground mb-1">Tier</p>
          <Badge variant="secondary">{profile.tier}</Badge>
        </div>
        <div className="rounded-lg border border-border px-3 py-2">
          <p className="text-xs text-muted-foreground mb-1">Status</p>
          <Badge variant={kycStatusVariant[profile.status] ?? 'outline'}>
            {profile.status.replace('_', ' ')}
          </Badge>
        </div>
        {profile.submittedAt && (
          <div className="rounded-lg border border-border px-3 py-2 col-span-2">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Submitted
            </p>
            <p className="text-xs">
              {new Date(profile.submittedAt).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {userProfile && (
        <div className="rounded-lg border border-border px-3 py-2">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Wallet className="h-3 w-3" /> Wallet
          </p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Balance</span>
            <span className="font-medium tabular-nums">
              {(userProfile.wallet.balance / 100).toFixed(2)}{' '}
              {userProfile.wallet.currency}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-muted-foreground">Status</span>
            <Badge
              variant={
                userProfile.wallet.status === 'active'
                  ? 'default'
                  : 'destructive'
              }
              className="text-xs"
            >
              {userProfile.wallet.status}
            </Badge>
          </div>
        </div>
      )}

      {profile.documents && profile.documents.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Uploaded Documents
          </p>
          {profile.documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
            >
              <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                {docTypeIcon[doc.type] ?? <FileText className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">
                  {docTypeLabel[doc.type] ?? doc.type}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(doc.uploadedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <Badge
                variant={
                  doc.status === 'APPROVED'
                    ? 'default'
                    : doc.status === 'REJECTED'
                      ? 'destructive'
                      : 'secondary'
                }
                className="text-xs shrink-0"
              >
                {doc.status}
              </Badge>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">
          No documents uploaded.
        </p>
      )}

      {profile.rejectionReason && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
          <p className="text-xs text-destructive font-medium">
            Rejection reason
          </p>
          <p className="text-xs text-destructive/80 mt-0.5">
            {profile.rejectionReason}
          </p>
        </div>
      )}

      {profile.status === 'PENDING_REVIEW' && (
        <div className="flex gap-2 pt-1 border-t">
          <Button onClick={onApprove} disabled={approving} className="flex-1">
            <ShieldCheck className="h-4 w-4 mr-2" />
            {approving ? 'Approving…' : 'Approve'}
          </Button>
          <RejectDialog onReject={onReject} loading={rejecting} />
        </div>
      )}
      {profile.status !== 'PENDING_REVIEW' && (
        <p className="text-xs text-muted-foreground pt-1 border-t">
          {profile.status === 'APPROVED' && 'This profile is already approved.'}
          {profile.status === 'REJECTED' && 'This profile has been rejected.'}
          {profile.status === 'NONE' && 'No documents submitted yet.'}
        </p>
      )}
    </div>
  );
}
