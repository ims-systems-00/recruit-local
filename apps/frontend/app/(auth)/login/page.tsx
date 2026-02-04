'use client';
import Image from 'next/image';
import React from 'react';
import Logo from '@/public/images/logo.svg';
import { Button } from '@/components/ui/button';
import { EyeClosed, LockKeyholeOpen, MailIcon } from 'lucide-react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useLogin } from '@/services/auth/auth.client';

export default function Login() {
  const {
    register,
    onSubmit,
    isLoading,
    togglePassword,
    showPassword,
    errors,
  } = useLogin();

  return (
    <div className=" min-h-screen flex justify-center items-center">
      <div className=" shadow-regular w-[692px] h-[700px] rounded-lg flex flex-col gap-y-spacing-4xl p-spacing-5xl">
        <div>
          <Image
            className="max-h-[62px] max-w-[114px]"
            alt="Logo"
            src={Logo}
            width={114}
            height={62}
          />
        </div>

        <form
          onSubmit={onSubmit}
          className=" flex flex-col gap-y-spacing-6xl flex-1"
        >
          <div className="space-y-spacing-4xl">
            <div className="space-y-spacing-xs">
              <h4 className=" text-label-lg font-label-lg-strong! text-text-gray-secondary">
                Welcome Back !!
              </h4>
              <p className=" text-body-md text-text-gray-tertiary">
                Please log into our portal.
              </p>
            </div>
            <div className="space-y-spacing-4xl">
              <div className="space-y-spacing-2xl">
                <div className=" space-y-2">
                  <InputGroup className="h-12 rounded-lg shadow-xs border-border-gray-primary">
                    <InputGroupInput
                      type="email"
                      placeholder="Enter your email"
                      {...register('email', { required: true })}
                    />
                    <InputGroupAddon>
                      <MailIcon className=" text-fg-gray-tertiary" />
                    </InputGroupAddon>
                  </InputGroup>
                  {errors.email && (
                    <p className="text-sm text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className=" space-y-2">
                  <InputGroup className="h-12 rounded-lg shadow-xs border-border-gray-primary">
                    <InputGroupInput
                      type={showPassword ? 'text' : 'password'}
                      placeholder="*********"
                      {...register('password', { required: true })}
                    />
                    <InputGroupAddon>
                      <LockKeyholeOpen className=" text-fg-gray-tertiary" />
                    </InputGroupAddon>
                    <InputGroupAddon
                      className=" cursor-pointer"
                      align="inline-end"
                      onClick={togglePassword}
                    >
                      <EyeClosed className=" text-fg-gray-tertiary" />
                    </InputGroupAddon>
                  </InputGroup>
                  {errors.password && (
                    <p className="text-sm text-red-500">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>

              <div className=" flex justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember_me"
                    className=" data-[state=checked]:bg-bg-brand-solid-primary data-[state=checked]:text-text-white data-[state=checked]:border-bg-brand-solid-primary"
                  />
                  <Label htmlFor="remember_me">Remember me</Label>
                </div>
                <Link href="/forget-password" className="text-primary text-sm">
                  Forget Password?
                </Link>
              </div>
            </div>
          </div>

          <div className=" flex-1 flex justify-between flex-col">
            <Button
              type="submit"
              disabled={isLoading}
              className=" button-xl bg-bg-brand-solid-primary text-white! text-label-md font-label-md-strong! cursor-pointer"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>

            <div className=" flex justify-center">
              <p className="text-body-md">
                Don’t you have account?{' '}
                <Link href="/sign-up" className=" text-text-brand-primary">
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
