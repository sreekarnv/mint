'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/lib/hooks/use-user';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  ArrowLeftRight,
  FileText,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

const nav = [
  { label: 'Dashboard', href: '/app-admin/dashboard', icon: Users },
  { label: 'KYC', href: '/app-admin/kyc', icon: ShieldCheck },
  { label: 'Fraud', href: '/app-admin/fraud', icon: AlertTriangle },
  {
    label: 'Transactions',
    href: '/app-admin/transactions',
    icon: ArrowLeftRight,
  },
  { label: 'Audit Log', href: '/app-admin/audit', icon: FileText },
  { label: 'System', href: '/app-admin/system', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { hydrated, user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace('/login');
    } else if (user.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [hydrated, user, router]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-background p-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border bg-card px-6 py-3 flex items-center gap-3">
        <div className="w-7 h-7 rounded-md bg-foreground text-background flex items-center justify-center text-sm font-bold">
          M
        </div>
        <span className="text-sm font-semibold text-foreground">
          Mint Admin
        </span>
        <div className="ml-auto">
          <Button variant="destructive">Log Out</Button>
        </div>
      </div>
      <div className="flex flex-1">
        <aside className="w-56 border-r border-border p-4 space-y-1 sticky top-0 h-screen overflow-y-auto">
          {nav.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  active
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </aside>
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
