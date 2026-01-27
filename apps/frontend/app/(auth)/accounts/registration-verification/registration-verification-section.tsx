'use client';
import React from 'react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import ConfirmImg from '@/public/images/bro.svg';
import { useSearchParams } from 'next/navigation';
import { useTokenVerification } from './_hooks/useTokenVerification';
import { useRegistrationVerificationToken } from '@/services/auth/auth.client';
export default function RegistrationVerificationSection() {
  const searchParams = useSearchParams();
  const registrationToken = searchParams.get('registration_token');
  const { verified, error } = useTokenVerification(registrationToken);

  const { isLoading, verify } = useRegistrationVerificationToken();

  if (!verified)
    return (
      <div className="shadow-regular rounded-md p-spacing-4xl flex items-center justify-center gap-spacing-4xl max-w-lg w-full text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-2">{error}</h2>
      </div>
    );

  return (
    <div className="shadow-regular rounded-md p-12 flex items-center gap-spacing-4xl">
      <div className="min-w-[205px]">
        <Image
          className="max-h-[190px] max-w-[205px]"
          alt="Logo"
          src={ConfirmImg}
          width={205}
          height={190}
        />
      </div>
      <div className="flex items-center justify-center gap-spacing-4xl flex-col">
        <div className="flex flex-col items-center justify-center gap-spacing-lg">
          <h3>Verify your Account</h3>
          <p>Please click on the confirm button to verify your Account</p>
        </div>
        <Button
          disabled={isLoading}
          onClick={() => verify(registrationToken || '')}
          className=" min-w-[181px] text-base bg-primary border-primary text-white rounded-lg h-10"
        >
          Confirm
        </Button>
      </div>
    </div>
  );
}
