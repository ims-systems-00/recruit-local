'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { useResendVerificationLink } from '@/services/auth/auth.client';

export default function ResendVerificationButton() {
  const { isLoading, resend } = useResendVerificationLink();

  return (
    <Button
      onClick={() => resend()}
      disabled={isLoading}
      className=" min-w-[181px] text-base bg-primary border-primary text-white rounded-lg h-10"
    >
      Resend Verification
    </Button>
  );
}
