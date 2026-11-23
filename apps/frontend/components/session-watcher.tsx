'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { isSigningOut, resetSignOut } from '@/lib/auth/sign-out-intent';

const EXPIRED_MESSAGE = 'Session expired, please log in again';
// same id from both paths so it only shows once
const EXPIRED_TOAST_ID = 'session-expired';

export default function SessionWatcher() {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const previousStatus = useRef(status);

  useEffect(() => {
    const wasAuthenticated = previousStatus.current === 'authenticated';
    previousStatus.current = status;

    if (status === 'authenticated') {
      resetSignOut();
      return;
    }

    if (wasAuthenticated && status === 'unauthenticated' && !isSigningOut()) {
      toast.error(EXPIRED_MESSAGE, { id: EXPIRED_TOAST_ID });
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  // middleware sends expired page loads here
  useEffect(() => {
    if (pathname !== '/login') return;
    if (new URLSearchParams(window.location.search).get('expired') === '1') {
      toast.error(EXPIRED_MESSAGE, { id: EXPIRED_TOAST_ID });
    }
  }, [pathname]);

  return null;
}
