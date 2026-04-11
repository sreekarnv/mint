'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { authApi } from '@/lib/api/auth';
import { kycApi } from '@/lib/api/kyc';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useNotificationStore } from '@/lib/stores/notification.store';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftRight,
  BadgeCheck,
  BarChart3,
  Bell,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const nav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Wallet', href: '/wallet', icon: Wallet },
  { label: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Social', href: '/social', icon: Users },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Verification', href: '/kyc', icon: BadgeCheck },
];

const kycColors: Record<string, string> = {
  UNVERIFIED: 'text-zinc-400',
  BASIC: 'text-blue-400',
  VERIFIED: 'text-emerald-400',
};

export function Sidebar({ onNavigate }: { onNavigate?: () => void } = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearUser = useAuthStore((s) => s.clearUser);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const { data: kycProfile } = useQuery({
    queryKey: queryKeys.kyc.profile(),
    queryFn: kycApi.getProfile,
    enabled: !!user,
  });

  const kycTier = kycProfile?.tier ?? 'UNVERIFIED';

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    clearUser();
    onNavigate?.();
    router.push('/login');
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <aside className="w-60 shrink-0 h-full flex flex-col bg-sidebar border-r border-sidebar-border">
      <div className="h-14 px-5 flex items-center gap-3 border-b border-sidebar-border shrink-0">
        <div className="w-7 h-7 rounded-lg bg-sapphire-gradient flex items-center justify-center font-bold text-xs text-white shrink-0">
          M
        </div>
        <span className="text-sm font-semibold text-white tracking-wide">
          Mint
        </span>
      </div>

      <nav className="flex-1 px-2 py-4 overflow-y-auto space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/35 px-3 mb-3">
          Menu
        </p>
        {nav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          const isNotif = href === '/notifications';
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                'group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                active
                  ? 'bg-sidebar-accent text-sidebar-primary-foreground font-medium'
                  : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5 font-normal',
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-sidebar-primary rounded-r-full" />
              )}
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors',
                  active
                    ? 'text-sidebar-primary'
                    : 'text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70',
                )}
              />
              <span className="flex-1">{label}</span>
              {isNotif && unreadCount > 0 && (
                <span
                  className={cn(
                    'text-[10px] font-bold min-w-5 h-4 px-1.5 rounded-full flex items-center justify-center',
                    active
                      ? 'bg-sidebar-primary/20 text-sidebar-primary'
                      : 'bg-sidebar-primary text-white',
                  )}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              {active && !isNotif && (
                <ChevronRight className="h-3 w-3 text-sidebar-primary/50 shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-2 py-3 shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg mb-1">
          <Avatar className="h-8 w-8 shrink-0 ring-2 ring-sidebar-border">
            <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate leading-none">
              {user?.name ?? 'User'}
            </p>
            <p className="text-[10px] text-sidebar-foreground/50 truncate mt-0.5">
              {user?.email}
            </p>
          </div>
          {kycTier && (
            <ShieldCheck
              className={cn('h-3.5 w-3.5 shrink-0', kycColors[kycTier])}
            />
          )}
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-sidebar-foreground/40 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-150"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
