'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { Button } from '@/components/ui/button';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

import { signupSchema, SignupFormValues } from './signup.schema';

import { EyeClosed, Eye } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { registerUser } from '@/services/auth/auth.server';

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, setValue } = useForm<SignupFormValues>({
    resolver: yupResolver(signupSchema),
  });

  const onFormSubmit = async (data: SignupFormValues) => {
    const res = await registerUser(data);

    if (!res.success) {
      console.log('Registered', res.message); // or toast later
      return;
    }

    // success case
    console.log('Registered:', res.data);
  };

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
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
                    {...register('firstName')}
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
                    {...register('lastName')}
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
                  {...register('email')}
                />
              </InputGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-title text-base leading-[100%]">
                User Type
              </Label>

              <Select onValueChange={(v) => setValue('type', v)}>
                <SelectTrigger className="h-10! w-full">
                  <SelectValue placeholder="Choose your Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="employer">Employer</SelectItem>
                    <SelectItem value="candidate">Candidate</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-title text-base leading-[100%]">
                New Password
              </Label>
              <InputGroup className="h-10 rounded-lg shadow-light">
                <InputGroupInput
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Set a New Password"
                  {...register('password')}
                />
                <InputGroupAddon
                  align="inline-end"
                  onClick={() => setShowPassword((p) => !p)}
                >
                  {showPassword ? <Eye /> : <EyeClosed />}
                </InputGroupAddon>
              </InputGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-title text-base leading-[100%]">
                Confirm Password
              </Label>
              <InputGroup className="h-10 rounded-lg shadow-light">
                <InputGroupInput
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Rewrite the password"
                  {...register('confirmPassword')}
                />
                <InputGroupAddon
                  align="inline-end"
                  onClick={() => setShowPassword((p) => !p)}
                >
                  {showPassword ? <Eye /> : <EyeClosed />}
                </InputGroupAddon>
              </InputGroup>
            </div>
          </div>

          <div className=" flex justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="agreed"
                className="w-4 h-4 rounded-xs shadow-none border border-border"
                onCheckedChange={(v) => setValue('agreed', !!v)}
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

      <div className=" flex-1 flex justify-between flex-col gap-8">
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
  );
}
