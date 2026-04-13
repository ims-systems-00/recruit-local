'use client';

import React from 'react';

import { Label } from '@/components/ui/label';
import { InputGroup, InputGroupTextarea } from '@/components/ui/input-group';
import { Control, FieldErrors, UseFormRegister } from 'react-hook-form';
import { TenantUpdateInput } from '@/services/tenants/tenants.validation';

type EditProfileProps = {
  register: UseFormRegister<TenantUpdateInput>;
  control: Control<TenantUpdateInput>;
  errors: FieldErrors<TenantUpdateInput>;
};

export default function EditServicesAndProducts({
  register,
  errors,
}: EditProfileProps) {
  return (
    <div className=" space-y-spacing-2xl">
      <h4 className=" text-text-gray-secondary text-heading-sm font-heading-sm-strong!">
        Edit Profile
      </h4>

      <div className=" space-y-spacing-2xl">
        <div className="space-y-spacing-2xl">
          <div className="grid grid-cols-1 gap-spacing-2xl">
            <div className="space-y-spacing-xs ">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Mission Statement
              </Label>
              <div className=" space-y-spacing-sm ">
                <InputGroup className="rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupTextarea
                    placeholder="Write here..."
                    {...register('missionStatement')}
                    className="min-h-[136px] text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                  />
                </InputGroup>
                {errors.missionStatement && (
                  <p className="text-sm text-red-500">
                    {errors.missionStatement.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-spacing-xs ">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Vision Statement
              </Label>
              <div className=" space-y-spacing-sm ">
                <InputGroup className="rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupTextarea
                    placeholder="Write here..."
                    {...register('visionStatement')}
                    className="min-h-[136px] text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                  />
                </InputGroup>
                {errors.visionStatement && (
                  <p className="text-sm text-red-500">
                    {errors.visionStatement.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-spacing-xs ">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Core Product
              </Label>
              <div className=" space-y-spacing-sm ">
                <InputGroup className="rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupTextarea
                    placeholder="Write here..."
                    {...register('coreProducts')}
                    className="min-h-[136px] text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                  />
                </InputGroup>
                {errors.coreProducts && (
                  <p className="text-sm text-red-500">
                    {errors.coreProducts.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-spacing-xs ">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Core Services
              </Label>
              <div className=" space-y-spacing-sm ">
                <InputGroup className="rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupTextarea
                    placeholder="Write here..."
                    {...register('coreServices')}
                    className="min-h-[136px] text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                  />
                </InputGroup>
                {errors.coreServices && (
                  <p className="text-sm text-red-500">
                    {errors.coreServices.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
