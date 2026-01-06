'use client';

import React from 'react';
import { Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

import { EyeClosed, Eye } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSignup } from '@/services/auth/auth.client';

export default function SignUpForm() {
  const {
    register,
    onSubmit,
    showPassword,
    togglePassword,
    isSubmitting,
    formState: { errors, isValid },
    control,
  } = useSignup();

  return (
    <form onSubmit={onSubmit} className=" flex flex-col gap-y-10 flex-1">
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
                <div className=" space-y-2">
                  <InputGroup className="h-10 rounded-lg shadow-light">
                    <InputGroupInput
                      type="text"
                      placeholder="Enter your First Name"
                      {...register('firstName')}
                    />
                  </InputGroup>
                  {errors.firstName && (
                    <p className="text-sm text-red-500">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-title text-base leading-[100%]">
                  Last Name
                </Label>
                <div className=" space-y-2">
                  <InputGroup className="h-10 rounded-lg shadow-light">
                    <InputGroupInput
                      type="text"
                      placeholder="Enter your Last Name"
                      {...register('lastName')}
                    />
                  </InputGroup>
                  {errors.lastName && (
                    <p className="text-sm text-red-500">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-title text-base leading-[100%]">
                Email Address
              </Label>
              <div className=" space-y-2">
                <InputGroup className="h-10 rounded-lg shadow-light">
                  <InputGroupInput
                    type="email"
                    placeholder="Enter your email"
                    {...register('email')}
                  />
                </InputGroup>
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-title text-base leading-[100%]">
                User Type
              </Label>

              <div className=" space-y-2">
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
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
                  )}
                />
                {errors.type && (
                  <p className="text-sm text-red-500">{errors.type.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-title text-base leading-[100%]">
                New Password
              </Label>
              <div className=" space-y-2">
                <InputGroup className="h-10 rounded-lg shadow-light">
                  <InputGroupInput
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Set a New Password"
                    {...register('password')}
                  />
                  <InputGroupAddon align="inline-end" onClick={togglePassword}>
                    {showPassword ? <Eye /> : <EyeClosed />}
                  </InputGroupAddon>
                </InputGroup>
                {errors.password && (
                  <p className="text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-title text-base leading-[100%]">
                Confirm Password
              </Label>
              <div className=" space-y-2">
                <InputGroup className="h-10 rounded-lg shadow-light">
                  <InputGroupInput
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Rewrite the password"
                    {...register('confirmPassword')}
                  />
                  <InputGroupAddon align="inline-end" onClick={togglePassword}>
                    {showPassword ? <Eye /> : <EyeClosed />}
                  </InputGroupAddon>
                </InputGroup>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className=" flex justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Controller
                name="agreed"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="agreed"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="w-4 h-4 rounded-xs shadow-none border border-border"
                  />
                )}
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
          className=" w-full text-base bg-primary border-primary text-white rounded-lg h-10 cursor-pointer"
          disabled={isSubmitting || !isValid}
        >
          {isSubmitting ? 'Loading...' : 'Sign Up'}
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
