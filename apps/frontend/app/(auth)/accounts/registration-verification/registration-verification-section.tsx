'use client';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';
import { useTokenVerification } from './_hooks/useTokenVerification';
import { useRegistrationVerificationToken } from '@/services/auth/auth.client';
import { Mail } from 'lucide-react';
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
    <div className=" flex justify-center items-center bg-card">
      <div className=" flex justify-center items-center">
        <div className=" w-[692px] bg-bg-gray-soft-primary rounded-lg flex flex-col items-center justify-center gap-y-spacing-4xl p-spacing-5xl">
          <div className=" w-20 h-20 bg-others-brand-brand-zero border border-others-brand-light rounded-full flex items-center justify-center">
            <Mail className="size-10 text-others-brand-dark" />
          </div>
          <div className="space-y-spacing-lg text-center">
            <p className=" text-heading-sm font-heading-sm-strong! text-text-gray-primary">
              Verify your Account
            </p>
            <p className="text-label-lg text-text-gray-quaternary">
              Please click on the confirm button to verify your Account
            </p>
          </div>
          <Button
            disabled={isLoading}
            onClick={() => verify(registrationToken || '')}
            className=" min-w-[181px] text-base bg-bg-brand-solid-primary border-primary text-white rounded-lg h-10"
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
