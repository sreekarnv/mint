'use client';

import { useUser } from '@/lib/hooks/use-user';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { hydrated, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && user) {
      if (user.role === 'ADMIN') {
        router.replace('/app-admin/dashboard');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [hydrated, user, router]);

  if (hydrated && user) return null;

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex w-[420px] shrink-0 flex-col justify-between bg-[#0F1117] p-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sapphire-gradient flex items-center justify-center font-bold text-sm text-white">
            M
          </div>
          <span className="text-white font-semibold tracking-wide">Mint</span>
        </div>
        <div>
          <blockquote
            className="text-3xl font-medium text-white leading-snug mb-6"
            style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
          >
            &ldquo;Your money,
            <br />
            your future.&rdquo;
          </blockquote>
          <p className="text-sm text-white/40 leading-relaxed">
            Secure, instant, and transparent. Mint gives you full control over
            every transaction.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <p className="text-xs text-white/30">All systems operational</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="flex items-center gap-2.5 mb-8 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-sapphire-gradient flex items-center justify-center font-bold text-sm text-white">
            M
          </div>
          <span className="font-semibold tracking-wide">Mint</span>
        </div>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
