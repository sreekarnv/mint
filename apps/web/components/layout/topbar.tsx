'use client';

import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { NotificationBell } from './notification-bell';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of your finances' },
  '/wallet': { title: 'Wallet', subtitle: 'Manage your balance' },
  '/transactions': {
    title: 'Transactions',
    subtitle: 'Your transaction history',
  },
  '/analytics': {
    title: 'Analytics',
    subtitle: 'Insights & spending patterns',
  },
  '/social': { title: 'Social', subtitle: 'Send money & split bills' },
  '/notifications': { title: 'Notifications', subtitle: 'Activity & alerts' },
  '/kyc': {
    title: 'Identity Verification',
    subtitle: 'Manage your verification tier',
  },
};

function getPageInfo(pathname: string) {
  for (const [prefix, info] of Object.entries(pageTitles)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return info;
  }
  return { title: 'Mint', subtitle: '' };
}

export function Topbar({
  onMobileMenuOpen,
}: {
  onMobileMenuOpen?: () => void;
}) {
  const pathname = usePathname();
  const { title, subtitle } = getPageInfo(pathname);

  return (
    <header className="h-14 shrink-0 border-b border-border bg-card/80 backdrop-blur-sm px-4 md:px-6">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            onClick={onMobileMenuOpen}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-baseline gap-2.5">
            <h1 className="text-sm font-semibold text-foreground tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <>
                <span className="text-border select-none hidden sm:inline">
                  /
                </span>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {subtitle}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
