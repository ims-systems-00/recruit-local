'use client';

import { SessionProvider } from 'next-auth/react';
import SessionWatcher from '@/components/session-watcher';

export default function NextAuthProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider refetchInterval={5 * 60}>
      <SessionWatcher />
      {children}
    </SessionProvider>
  );
}
