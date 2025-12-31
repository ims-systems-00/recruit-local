import React from 'react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import ConfirmImg from '@/public/images/bro.svg';

export default function RegistrationVerification() {
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
          <div className="flex flex-col items-center justify-center gap-3">
            <h3>Verify your Account</h3>
            <p>Please click on the confirm button to verify your Account</p>
          </div>
          <Button className=" min-w-[181px] text-base bg-primary border-primary text-white rounded-lg h-10">
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
