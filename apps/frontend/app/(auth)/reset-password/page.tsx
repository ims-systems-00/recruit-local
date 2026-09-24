import { Suspense } from 'react';
import ResetPasswordForm from './sections/reset-password-form';

export default function ResetPassword() {
  return (
    <Suspense fallback={<div>Verifying...</div>}>
      <div className=" flex justify-center items-center">
        <ResetPasswordForm />
      </div>
    </Suspense>
  );
}
