'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Alert } from '@/components/ui/Alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

type Role = 'user' | 'reviewer' | 'organizer' | 'admin';

export function RequireAuth({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: Role[];
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading) return <LoadingSpinner />;
  if (!user) return null;
  if (roles && !roles.includes(user.role)) {
    return <Alert variant="error">Недостаточно прав для просмотра этой страницы.</Alert>;
  }

  return <>{children}</>;
}
