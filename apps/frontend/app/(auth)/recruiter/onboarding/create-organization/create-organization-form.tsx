'use client';
import React from 'react';
import { Button } from '@/components/ui/button';

import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { useCreateTanent } from '@/services/tenants/tenants.client';
import { useLogout } from '@/services/auth/auth.client';
export default function CreateOrganizationForm() {
  const { logout, isLoading: isLoggingOut } = useLogout();
  const {
    register,
    onSubmit,
    isSubmitting,
    formState: { errors, isValid },
    control,
  } = useCreateTanent();
  return (
    <form onSubmit={onSubmit} className=" space-y-spacing-4xl w-full">
      <div className="space-y-spacing-xs">
        <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
          Organization Name
        </Label>
        <div className=" space-y-spacing-3xs">
          <InputGroup className="h-12 rounded-lg shadow-light">
            <InputGroupInput
              type="text"
              placeholder="Enter Organization name"
              {...register('name')}
            />
          </InputGroup>
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>
      </div>
      <div className=" flex justify-end items-center gap-4 pt-3 border-t border-border">
        <Button
          type="button"
          onClick={() => logout()}
          disabled={isLoggingOut || isSubmitting}
          className=" cursor-pointer text-base bg-transparent border border-border text-title rounded-lg h-10 hover:bg-transparent"
        >
          {isLoggingOut ? 'Logging out...' : 'Cancel'}
        </Button>
        <Button
          type="submit"
          disabled={isLoggingOut || isSubmitting}
          className=" cursor-pointer text-base bg-bg-brand-solid-primary border-primary text-white rounded-lg h-10"
        >
          {isSubmitting ? 'Creating...' : 'Continue'}
        </Button>
      </div>
    </form>
  );
}
