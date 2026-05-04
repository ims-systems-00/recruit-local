import React, { Suspense } from 'react';
import RegistrationVerificationSection from './registration-verification-section';

export default function RegistrationVerification() {
  return (
    <Suspense fallback={<div>Verifying...</div>}>
      <div className=" min-h-screen flex justify-center items-center bg-card">
        <RegistrationVerificationSection />
      </div>
    </Suspense>
  );
}
