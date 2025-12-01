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

export default function SignUp() {
  const onFormSubmit = (e: any) => {
    e.preventDefault();
    alert('sss');
    console.log('e', e);
  };
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

        <form
          onSubmit={onFormSubmit}
          className=" flex flex-col gap-y-10 flex-1"
        >
          <div className="space-y-6">
            <div className="space-y-3">
              <h4>Welcome Back !!</h4>
              <p>Please log into our portal.</p>
            </div>
            <div className="space-y-6">
              <div className="space-y-4">
                <InputGroup className="h-10 rounded-lg shadow-light">
                  <InputGroupInput
                    type="email"
                    placeholder="Enter your email"
                  />
                  <InputGroupAddon className="group-has-[[data-slot=input-group-control]:focus-visible]/input-group:text-primary">
                    <MailIcon />
                  </InputGroupAddon>
                </InputGroup>
                <InputGroup className="h-10 rounded-lg shadow-light">
                  <InputGroupInput type="password" placeholder="*********" />
                  <InputGroupAddon className="group-has-[[data-slot=input-group-control]:focus-visible]/input-group:text-primary">
                    <LockKeyholeOpen />
                  </InputGroupAddon>
                  <InputGroupAddon align="inline-end">
                    <EyeClosed />
                  </InputGroupAddon>
                </InputGroup>
              </div>
              <div className=" flex justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember_me"
                    className="w-4 h-4 rounded-xs shadow-none border border-border"
                  />
                  <Label htmlFor="remember_me" className="text-title text-sm">
                    Remember me
                  </Label>
                </div>
                <Link
                  href={'/forget-password'}
                  className=" text-sm text-primary"
                >
                  Forget Password?
                </Link>
              </div>
            </div>
          </div>
          <div className=" flex-1 flex justify-between flex-col">
            <Button
              type="submit"
              className=" w-full text-base bg-primary border-primary text-white rounded-lg h-10"
            >
              Login
            </Button>
            <div className=" flex justify-center">
              <p className="text-base text-body">
                Don’t you have account?{' '}
                <Link href={'/register'} className="text-primary">
                  Create Account
                </Link>{' '}
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
