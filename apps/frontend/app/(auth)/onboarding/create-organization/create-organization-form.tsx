'use client';
import React from 'react';
import { Button } from '@/components/ui/button';

import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { useCreateTanent } from '@/services/tenants/tenants.client';

export default function CreateOrganizationForm() {
  const {
    register,
    onSubmit,
    isSubmitting,
    formState: { errors, isValid },
    control,
  } = useCreateTanent();
  return (
    <form onSubmit={onSubmit} className=" space-y-12">
      <div className="space-y-6">
        <div className="space-y-3">
          <Label className="text-title text-base leading-[100%]">
            Organization Name
          </Label>
          <div className=" space-y-2">
            <InputGroup className="h-10 rounded-lg shadow-light">
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
      </div>
      <div className=" flex justify-end items-center gap-4 pt-3 border-t border-border">
        <Button className="text-base bg-transparent border border-border text-title rounded-lg h-10 hover:bg-transparent">
          Cancel
        </Button>
        <Button
          type="submit"
          className="text-base bg-primary border-primary text-white rounded-lg h-10"
        >
          Continue
        </Button>
      </div>
    </form>
  );
}
