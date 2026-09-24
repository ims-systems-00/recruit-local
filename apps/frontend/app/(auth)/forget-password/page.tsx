'use client';
import { Button } from '@/components/ui/button';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { MailIcon } from 'lucide-react';
import { useForgotPassword } from '@/services/auth/auth.client';
import { useForm } from 'react-hook-form';
import {
  forgotPasswordSchema,
  ForgotPasswordSchema,
} from '@/services/auth/auth.validation';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';

export default function ForgotPassword() {
  const router = useRouter();
  const { forgotPassword, isLoading } = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordSchema>({
    resolver: yupResolver(forgotPasswordSchema),
  });

  const onSubmit = (data: ForgotPasswordSchema) => {
    forgotPassword(data.email);
  };
  return (
    <div className=" flex justify-center items-center">
      <div className=" w-[692px] rounded-lg p-spacing-5xl">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className=" flex flex-col gap-y-spacing-5xl flex-1"
        >
          <div className="space-y-spacing-lg">
            <h4 className=" text-heading-sm font-heading-sm-strong! text-text-gray-primary">
              Reset Password
            </h4>
            <p className=" text-body-md text-text-gray-tertiary">
              Please enter the email address associated with your account, and
              we will send you a link to reset your password.
            </p>
          </div>
          <div className=" space-y-spacing-4xl">
            <div className=" space-y-spacing-xs">
              <InputGroup className="h-12 rounded-lg shadow-xs border-border-gray-primary">
                <InputGroupInput
                  {...register('email')}
                  type="email"
                  placeholder="Enter your email"
                />
                <InputGroupAddon className="group-has-[[data-slot=input-group-control]:focus-visible]/input-group:text-text-brand-primary">
                  <MailIcon />
                </InputGroupAddon>
              </InputGroup>
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className=" flex justify-end items-center gap-4">
              <Button
                type="button"
                disabled={isLoading}
                onClick={() => router.push('/login')}
                className=" cursor-pointer text-base bg-transparent hover:bg-transparent border border-border text-title rounded-lg h-10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className=" cursor-pointer text-base bg-bg-brand-solid-primary border-primary text-white rounded-lg h-10"
              >
                {isLoading ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
