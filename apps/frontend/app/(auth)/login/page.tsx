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
    <div className=" min-h-screen flex justify-center items-center bg-card">
      <div className=" shadow-regular w-[692px] h-[700px] bg-card rounded-lg flex flex-col gap-y-8 p-8">
        <div>
          <Image
            className="max-h-[62px] max-w-[114px]"
            alt="Logo"
            src={Logo}
            width={114}
            height={62}
          />
        </div>

        <form onSubmit={onSubmit} className=" flex flex-col gap-y-10 flex-1">
          <div className="space-y-6">
            <div className="space-y-3">
              <h4>Welcome Back !!</h4>
              <p>Please log into our portal.</p>
            </div>
            <div className="space-y-6">
              <div className="space-y-4">
                <div className=" space-y-2">
                  <InputGroup className="h-10 rounded-lg shadow-light">
                    <InputGroupInput
                      type="email"
                      placeholder="Enter your email"
                      {...register('email', { required: true })}
                    />
                    <InputGroupAddon>
                      <MailIcon />
                    </InputGroupAddon>
                  </InputGroup>
                  {errors.email && (
                    <p className="text-sm text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className=" space-y-2">
                  <InputGroup className="h-10 rounded-lg shadow-light">
                    <InputGroupInput
                      type={showPassword ? 'text' : 'password'}
                      placeholder="*********"
                      {...register('password', { required: true })}
                    />
                    <InputGroupAddon>
                      <LockKeyholeOpen />
                    </InputGroupAddon>
                    <InputGroupAddon
                      className=" cursor-pointer"
                      align="inline-end"
                      onClick={togglePassword}
                    >
                      <EyeClosed />
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
                  <Checkbox id="remember_me" />
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
              className=" w-full text-base bg-primary text-white h-10 cursor-pointer"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>

            <div className=" flex justify-center">
              <p>
                Don’t you have account?{' '}
                <Link href="/sign-up" className="text-primary">
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
