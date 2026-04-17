'use client';

import React from 'react';
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';

import { Label } from '@/components/ui/label';
import { MailIcon } from 'lucide-react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import {
  Control,
  Controller,
  FieldErrors,
  UseFormRegister,
} from 'react-hook-form';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TENANT_INDUSTRY_ENUMS, TENANT_TYPE } from '@rl/types';
import LocationSelector from '@/components/location-selector';
import { JobProfileUpdateInput } from '@/services/job-profile/job-profile.type';

export const ORG_TYPE_OPTIONS = [
  { label: 'Private', value: TENANT_TYPE.PRIVATE },
  { label: 'Public', value: TENANT_TYPE.PUBLIC },
];

export const TENANT_INDUSTRY_OPTIONS = [
  { label: 'Technology', value: TENANT_INDUSTRY_ENUMS.TECHNOLOGY },
  { label: 'Finance', value: TENANT_INDUSTRY_ENUMS.FINANCE },
  { label: 'Healthcare', value: TENANT_INDUSTRY_ENUMS.HEALTHCARE },
  { label: 'Education', value: TENANT_INDUSTRY_ENUMS.EDUCATION },
  { label: 'Manufacturing', value: TENANT_INDUSTRY_ENUMS.MANUFACTURING },
  { label: 'Retail', value: TENANT_INDUSTRY_ENUMS.RETAIL },
  { label: 'Hospitality', value: TENANT_INDUSTRY_ENUMS.HOSPITALITY },
  { label: 'Construction', value: TENANT_INDUSTRY_ENUMS.CONSTRUCTION },
  { label: 'Transportation', value: TENANT_INDUSTRY_ENUMS.TRANSPORTATION },
  { label: 'Energy', value: TENANT_INDUSTRY_ENUMS.ENERGY },
];

type EditProfileProps = {
  register: UseFormRegister<JobProfileUpdateInput>;
  control: Control<JobProfileUpdateInput>;
  errors: FieldErrors<JobProfileUpdateInput>;
};

export default function EditProfile({
  register,
  control,
  errors,
}: EditProfileProps) {
  return (
    <div className=" space-y-spacing-2xl">
      <h4 className=" text-text-gray-primary text-label-xl font-label-xl-strong!">
        Basic Information
      </h4>

      <div className=" space-y-spacing-2xl">
        <div className="space-y-spacing-2xl">
          <div className="grid grid-cols-2 gap-spacing-2xl">
            <div className="space-y-spacing-xs">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Applicant Name
              </Label>
              <div className=" space-y-spacing-sm">
                <InputGroup
                  className={cn(
                    'h-10 rounded-lg shadow-xs border-border-gray-primary',
                    errors.name && ' border-border-error-primary',
                  )}
                >
                  <InputGroupInput
                    type="text"
                    placeholder=" Eg . John Doe"
                    className=" text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                    {...register('name')}
                  />
                </InputGroup>
                {errors.name && (
                  <p className="text-xs text-text-error-primary">
                    {errors.name.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-spacing-xs">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Title
              </Label>
              <div className=" space-y-spacing-sm">
                <InputGroup
                  className={cn(
                    'h-10 rounded-lg shadow-xs border-border-gray-primary',
                    errors.headline && ' border-border-error-primary',
                  )}
                >
                  <InputGroupInput
                    type="text"
                    placeholder=" Eg . Software Engineer"
                    className=" text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                    {...register('headline')}
                  />
                </InputGroup>
                {errors.headline && (
                  <p className="text-xs text-text-error-primary">
                    {errors.headline.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-spacing-xs col-span-2">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Address
              </Label>
              <div className=" space-y-spacing-sm">
                <Controller
                  control={control}
                  name="address"
                  render={({ field }) => (
                    <LocationSelector
                      defaultValue={field.value}
                      onSelectLocation={(val) => {
                        field.onChange(val.address);
                      }}
                    />
                  )}
                />
                {errors.address && (
                  <p className="text-sm text-red-500">
                    {errors.address.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-spacing-xs">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Email Address
              </Label>
              <div className=" space-y-spacing-sm">
                <InputGroup className="h-10 rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupInput
                    type="text"
                    placeholder="Eg. elena@example.com"
                    {...register('email')}
                    className="text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                  />
                  <InputGroupAddon>
                    <MailIcon className=" text-fg-gray-tertiary" />
                  </InputGroupAddon>
                </InputGroup>
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-spacing-xs">
              <Label className="text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Contact Number
              </Label>

              <div className=" space-y-spacing-sm">
                <Controller
                  name="contactNumber"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput
                      {...field}
                      defaultCountry="GB"
                      international
                      placeholder="Eg. +91 9876543210"
                      className=" border h-10 rounded-lg shadow-xs border-border-gray-primary w-full text-text-gray-primary"
                    />
                  )}
                />
                {errors.contactNumber && (
                  <p className="text-sm text-red-500">
                    {errors.contactNumber.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-spacing-xs col-span-2">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Description of yourself
              </Label>
              <div className=" space-y-spacing-sm ">
                <InputGroup className="rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupTextarea
                    placeholder="Eg. I am a software engineer with 5 years of experience in React, Node.js, and MongoDB."
                    {...register('summary')}
                    className="min-h-[136px] text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                  />
                </InputGroup>
                {errors.summary && (
                  <p className="text-sm text-red-500">
                    {errors.summary.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-spacing-xs col-span-2">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Portfolio URL
              </Label>
              <div className=" space-y-spacing-sm">
                <InputGroup
                  className={cn(
                    'h-10 rounded-lg shadow-xs border-border-gray-primary',
                    errors.portfolioUrl && ' border-border-error-primary',
                  )}
                >
                  <InputGroupInput
                    type="text"
                    placeholder=" Eg . https://your-portfolio.com"
                    className=" text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                    {...register('portfolioUrl')}
                  />
                </InputGroup>
                {errors.portfolioUrl && (
                  <p className="text-sm text-red-500">
                    {errors.portfolioUrl.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-spacing-xs col-span-2">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Skills
              </Label>
              <div className=" space-y-spacing-sm ">
                <InputGroup className="rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupTextarea
                    placeholder="Eg. React, Node.js, MongoDB"
                    {...register('skills')}
                    className="min-h-[136px] text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                  />
                </InputGroup>
                {errors.skills && (
                  <p className="text-sm text-red-500">
                    {errors.skills.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-spacing-xs col-span-2">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Interests
              </Label>
              <div className=" space-y-spacing-sm ">
                <InputGroup className="rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupTextarea
                    placeholder="Eg. Traveling, Reading, Cooking"
                    {...register('interests')}
                    className="min-h-[136px] text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                  />
                </InputGroup>
                {errors.interests && (
                  <p className="text-sm text-red-500">
                    {errors.interests.message}
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
