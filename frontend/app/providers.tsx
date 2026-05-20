'use client';

import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/components/ui/Toast';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';
import { AppQueryProvider } from '@/lib/queryClient';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AppQueryProvider>
        <AuthProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </AuthProvider>
      </AppQueryProvider>
    </ToastProvider>
  );
}
