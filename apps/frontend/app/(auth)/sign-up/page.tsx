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
        <div className=" flex gap-4">
          <div className="min-w-[114px]">
            <Image
              className="max-h-[62px] max-w-[114px]"
              alt="Logo"
              src={Logo}
              width={114}
              height={62}
            />
          </div>
          <div className="space-y-2">
            <p className=" text-sm font-medium text-body">
              Empowering Employers, Job Seekers & Trainers in Your Community
            </p>
            <p className=" text-xs leading-4  text-body">
              Recruit Local connects employers, job seekers, and trainers in one
              platform to build stronger local careers and businesses. Whether
              you're hiring, seeking a job, or offering training, we help you
              grow where you are.
            </p>
          </div>
        </div>

        <form
          onSubmit={onFormSubmit}
          className=" flex flex-col gap-y-10 flex-1"
        >
          <div className="space-y-6">
            <div className="space-y-3">
              <h4>Welcome to Recruit Local</h4>
              <p>Sign Up to Unlock Exclusive Features</p>
            </div>
            <div className="space-y-6">
              <div className="space-y-4">
                <div className=" grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-title text-base leading-[100%]">
                      First Name
                    </Label>
                    <InputGroup className="h-10 rounded-lg shadow-light">
                      <InputGroupInput
                        type="text"
                        placeholder="Enter your First Name"
                      />
                    </InputGroup>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-title text-base leading-[100%]">
                      Last Name
                    </Label>
                    <InputGroup className="h-10 rounded-lg shadow-light">
                      <InputGroupInput
                        type="text"
                        placeholder="Enter your Last Name"
                      />
                    </InputGroup>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-title text-base leading-[100%]">
                    Email Address
                  </Label>
                  <InputGroup className="h-10 rounded-lg shadow-light">
                    <InputGroupInput
                      type="email"
                      placeholder="Enter your email"
                    />
                  </InputGroup>
                </div>
                <div className="space-y-3">
                  <Label className="text-title text-base leading-[100%]">
                    New Password
                  </Label>
                  <InputGroup className="h-10 rounded-lg shadow-light">
                    <InputGroupInput
                      type="password"
                      placeholder="Set a New Password"
                    />

                    <InputGroupAddon align="inline-end">
                      <EyeClosed />
                    </InputGroupAddon>
                  </InputGroup>
                </div>
                <div className="space-y-3">
                  <Label className="text-title text-base leading-[100%]">
                    Confirm Password
                  </Label>
                  <InputGroup className="h-10 rounded-lg shadow-light">
                    <InputGroupInput
                      type="password"
                      placeholder="Rewrite the password"
                    />

                    <InputGroupAddon align="inline-end">
                      <EyeClosed />
                    </InputGroupAddon>
                  </InputGroup>
                </div>
              </div>
              <div className=" flex justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="agreed"
                    className="w-4 h-4 rounded-xs shadow-none border border-border"
                  />
                  <Label htmlFor="agreed" className="text-title text-sm">
                    I agree to the{' '}
                    <Link href={'/'} className="text-primary">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href={'/'} className="text-primary">
                      Privacy Notice
                    </Link>
                  </Label>
                </div>
              </div>
            </div>
          </div>
          <div className=" flex-1 flex justify-between flex-col">
            <Button
              type="submit"
              className=" w-full text-base bg-primary border-primary text-white rounded-lg h-10"
            >
              Sign Up
            </Button>
            <div className=" flex justify-center">
              <p className="text-base text-body">
                Already In Recruit Local ?{' '}
                <Link href={'/login'} className="text-primary">
                  Login Here
                </Link>{' '}
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
