'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicConferenceSite = pathname?.startsWith('/c/');

  if (isPublicConferenceSite) {
    return <div className="min-h-screen bg-white">{children}</div>;
  }

  return (
    <>
      <Header />
      <EmailVerificationBanner />
      <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-4 py-8">{children}</main>
    </>
  );
}
