'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { authApi } from '@/lib/api/auth';
import { kycApi } from '@/lib/api/kyc';
import { useNotifications } from '@/lib/hooks/use-notifications';
import { useUser } from '@/lib/hooks/use-user';
import { queryKeys } from '@/lib/query-keys';
import { useQuery } from '@tanstack/react-query';
import { MailWarning, ShieldAlert, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

function AppSkeleton() {
  return (
    <div className="flex h-screen">
      <div className="hidden md:flex w-60 shrink-0 h-screen border-r bg-[#0F1117] border-[#1C2032] flex-col">
        <div className="h-14 px-5 flex items-center gap-3 border-b border-[#1C2032]">
          <Skeleton className="w-7 h-7 rounded-lg bg-white/10" />
          <Skeleton className="h-3 w-12 bg-white/10" />
        </div>
        <div className="flex-1 px-2 py-4 space-y-0.5">
          <Skeleton className="h-2.5 w-8 mb-3 mx-3 bg-white/10" />
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg bg-white/5" />
          ))}
        </div>
        <div className="border-t border-[#1C2032] px-2 py-3">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-2.5 w-20 bg-white/10" />
              <Skeleton className="h-2 w-28 bg-white/10" />
            </div>
          </div>
        </div>
      </div>
      {/* Main skeleton */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-14 border-b border-border bg-card" />
        <div className="flex-1 p-4 md:p-6 space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-56 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function EmailVerificationBanner({ email }: { email: string }) {
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  if (dismissed) return null;

  async function resend() {
    setSending(true);
    try {
      await authApi.resendVerification();
      toast.success(`Verification email sent to ${email}`);
    } catch {
      toast.error('Failed to resend verification email');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center gap-3 text-sm">
        <MailWarning className="h-4 w-4 text-amber-600 shrink-0" />
        <p className="flex-1 text-amber-800 text-xs sm:text-sm">
          Please verify your email address to unlock all features.{' '}
          <button
            onClick={resend}
            disabled={sending}
            className="font-medium underline underline-offset-2 hover:no-underline disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Resend verification email'}
          </button>
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-600 hover:text-amber-800"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function KycVerificationBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { data: kycProfile } = useQuery({
    queryKey: queryKeys.kyc.profile(),
    queryFn: kycApi.getProfile,
  });

  if (dismissed || !kycProfile || kycProfile.tier !== 'UNVERIFIED') return null;

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center gap-3 text-sm">
        <ShieldAlert className="h-4 w-4 text-blue-600 shrink-0" />
        <p className="flex-1 text-blue-800 text-xs sm:text-sm">
          Verify your identity to unlock transfers, deposits, and higher limits.{' '}
          <Link
            href="/kyc"
            className="font-medium underline underline-offset-2 hover:no-underline"
          >
            Complete verification →
          </Link>
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="text-blue-600 hover:text-blue-800"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { hydrated, user } = useUser();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useNotifications();

  useEffect(() => {
    if (hydrated && !user) {
      router.replace('/login');
    } else if (user?.role === 'ADMIN') {
      router.replace('/app-admin/dashboard');
    }
  }, [hydrated, user, router]);

  if (!hydrated) return <AppSkeleton />;
  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:flex h-screen">
        <Sidebar />
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="p-0 w-60 overflow-hidden border-0 [&>button:first-child]:hidden"
          style={{ backgroundColor: '#0F1117' }}
        >
          <Sidebar onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar onMobileMenuOpen={() => setMobileNavOpen(true)} />
        {user.email_verified === false && (
          <EmailVerificationBanner email={user.email} />
        )}
        {user.email_verified !== false && <KycVerificationBanner />}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
