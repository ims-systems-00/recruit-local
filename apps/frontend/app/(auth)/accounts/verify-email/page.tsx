import React from 'react';
import Image from 'next/image';

import ConfirmImg from '@/public/images/pana.svg';
import ResendVerificationButton from './resend-verification-button';
import { Mail } from 'lucide-react';

export default function RegistrationVerificationResend() {
  return (
    <div className=" flex justify-center items-center bg-card">
      <div className=" flex justify-center items-center">
        <div className=" w-[692px] bg-bg-gray-soft-primary rounded-lg flex flex-col items-center justify-center gap-y-spacing-4xl p-spacing-5xl">
          <div className=" w-20 h-20 bg-others-brand-brand-zero border border-others-brand-light rounded-full flex items-center justify-center">
            <Mail className="size-10 text-others-brand-dark" />
          </div>
          <div className="space-y-spacing-lg text-center">
            <p className=" text-heading-sm font-heading-sm-strong! text-text-gray-primary">
              Please Verify your Account
            </p>
            <p className="text-label-lg text-text-gray-quaternary">
              We have sent you a verification email. Please click on resend if
              you haven’t received any email
            </p>
          </div>
          <ResendVerificationButton />
        </div>
      </div>
    </div>
  );
}
