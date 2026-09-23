'use client';
import { Button } from '@/components/ui/button';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';

import { useChangePassword } from '@/services/auth/auth.client';
import { useForm } from 'react-hook-form';
import {
  changePasswordSchema,
  ChangePasswordSchema,
} from '@/services/auth/auth.validation';
import { yupResolver } from '@hookform/resolvers/yup';
import { EyeClosed, LockKeyholeOpen, Eye } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
export default function ResetPasswordForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const searchParams = useSearchParams();
  const recoveryToken = searchParams.get('recovery_token');
  const { changePassword, isLoading } = useChangePassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordSchema>({
    resolver: yupResolver(changePasswordSchema),
  });

  const onSubmit = (data: ChangePasswordSchema) => {
    changePassword({
      password: data.password,
      recovery_token: recoveryToken!,
    });
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
              Create New Password
            </h4>
            <p className=" text-body-md text-text-gray-tertiary">
              Your new password must be different from any previously used
              passwords.
            </p>
          </div>
          <div className=" space-y-spacing-4xl">
            <div className="space-y-spacing-4xl">
              <div className="space-y-spacing-xs">
                <Label className="text-label-sm font-label-sm-strong! text-text-gray-secondary">
                  New Password
                </Label>
                <InputGroup className="h-12 rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupInput
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="*********"
                  />
                  <InputGroupAddon className="group-has-[[data-slot=input-group-control]:focus-visible]/input-group:text-text-brand-primary">
                    <LockKeyholeOpen />
                  </InputGroupAddon>
                  <InputGroupAddon
                    align="inline-end"
                    className=" cursor-pointer"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? <EyeClosed /> : <Eye />}
                  </InputGroupAddon>
                </InputGroup>
                {errors.password && (
                  <p className="text-red-600 text-sm">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-spacing-xs">
                <Label className="text-label-sm font-label-sm-strong! text-text-gray-secondary">
                  Confirm Password
                </Label>
                <InputGroup className="h-12 rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupInput
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="*********"
                  />
                  <InputGroupAddon className="group-has-[[data-slot=input-group-control]:focus-visible]/input-group:text-text-brand-primary">
                    <LockKeyholeOpen />
                  </InputGroupAddon>
                  <InputGroupAddon
                    align="inline-end"
                    className=" cursor-pointer"
                    onClick={toggleConfirmPasswordVisibility}
                  >
                    {showConfirmPassword ? <EyeClosed /> : <Eye />}
                  </InputGroupAddon>
                </InputGroup>
                {errors.confirmPassword && (
                  <p className="text-red-600 text-sm">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>
            <div className=" flex justify-end items-center gap-4">
              <Button
                type="button"
                disabled={isLoading}
                onClick={() => router.push('/login')}
                className="text-base bg-transparent hover:bg-transparent cursor-pointer border border-border text-title rounded-lg h-10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="text-base bg-bg-brand-solid-primary border-primary cursor-pointer text-white rounded-lg h-10"
              >
                {isLoading ? 'Loading...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
