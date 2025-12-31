import React from 'react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import ConfirmImg from '@/public/images/pana.svg';

export default function RegistrationVerificationResend() {
  return (
    <div className=" min-h-screen flex justify-center items-center bg-card">
      <div className="shadow-regular rounded-md p-12 flex items-center gap-6">
        <div className="min-w-[205px]">
          <Image
            className="max-h-[190px] max-w-[205px]"
            alt="Logo"
            src={ConfirmImg}
            width={205}
            height={190}
          />
        </div>
        <div className="flex items-center justify-center gap-6 flex-col">
          <div className="flex flex-col items-center justify-center gap-3 max-w-[444px]">
            <h3>Please Verify your Account</h3>
            <p className="text-center leading-6">
              We have sent you a verification email. Please click on resend if
              you haven’t received any email
            </p>
          </div>
          <Button className=" min-w-[181px] text-base bg-primary border-primary text-white rounded-lg h-10">
            Resend Verification
          </Button>
        </div>
      </div>
    </div>
  );
}
