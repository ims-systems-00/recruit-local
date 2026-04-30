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
import { TenantUpdateInput } from '@/services/tenants/tenants.validation';

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
  register: UseFormRegister<TenantUpdateInput>;
  control: Control<TenantUpdateInput>;
  errors: FieldErrors<TenantUpdateInput>;
};

export default function EditProfile({
  register,
  control,
  errors,
}: EditProfileProps) {
  return (
    <div className=" space-y-spacing-2xl">
      <h4 className=" text-text-gray-secondary text-heading-sm font-heading-sm-strong!">
        Edit Profile
      </h4>

      <div className=" space-y-spacing-2xl">
        <div className="space-y-spacing-2xl">
          <div className="grid grid-cols-2 gap-spacing-2xl">
            <div className="space-y-spacing-xs col-span-2">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Organization Name
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
                    placeholder=" Eg . Boottech"
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
            <div className="space-y-spacing-xs ">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Organization Type
              </Label>

              <div className=" space-y-spacing-sm">
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="h-10! w-full rounded-lg shadow-xs border-border-gray-primary data-placeholder:text-text-gray-quaternary text-text-gray-primary text-label-md font-label-md-strong!">
                        <SelectValue placeholder="Eg. Public" />
                      </SelectTrigger>

                      <SelectContent className=" bg-white">
                        <SelectGroup>
                          {ORG_TYPE_OPTIONS.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && (
                  <p className="text-xs text-text-error-primary">
                    {errors.type.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-spacing-xs ">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Number of Employers
              </Label>
              <div className=" space-y-spacing-sm">
                <InputGroup className="h-10 rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupInput
                    type="number"
                    placeholder="05"
                    {...register('size')}
                    className="text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                  />
                </InputGroup>
                {errors.size && (
                  <p className="text-xs text-text-error-primary">
                    {errors.size.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-spacing-xs">
              <Label className=" text-label-sm  text-text-gray-secondary">
                Industry
              </Label>
              <div className=" space-y-spacing-sm">
                <Controller
                  name="industry"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="h-10! w-full rounded-lg shadow-xs border-border-gray-primary data-placeholder:text-text-gray-quaternary text-text-gray-primary text-label-md font-label-md-strong!">
                        <SelectValue placeholder="Eg. Technology" />
                      </SelectTrigger>

                      <SelectContent className=" bg-white">
                        <SelectGroup>
                          {TENANT_INDUSTRY_OPTIONS.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.industry && (
                  <p className="text-sm text-red-500">
                    {errors.industry.message}
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
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput
                      {...field}
                      defaultCountry="GB"
                      international
                      placeholder="Enter contact number"
                      className=" border h-10 rounded-lg shadow-xs border-border-gray-primary w-full text-text-gray-primary"
                    />
                  )}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-spacing-xs">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Office Address
              </Label>
              <div className=" space-y-spacing-sm">
                <Controller
                  control={control}
                  name="officeAddress"
                  render={({ field }) => (
                    <LocationSelector
                      defaultValue={field.value}
                      onSelectLocation={(val) => {
                        field.onChange(val.address);
                      }}
                    />
                  )}
                />
                {errors.officeAddress && (
                  <p className="text-sm text-red-500">
                    {errors.officeAddress.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-spacing-xs">
              <Label className=" text-label-sm  text-text-gray-secondary">
                Website
              </Label>
              <div className=" space-y-spacing-sm">
                <InputGroup className="h-10 rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupInput
                    type="text"
                    placeholder="Eg. https://your-website.com"
                    {...register('website')}
                    className="text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                  />
                </InputGroup>
                {errors.website && (
                  <p className="text-sm text-red-500">
                    {errors.website.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-spacing-xs">
              <Label className=" text-label-sm  text-text-gray-secondary">
                LinkedIn
              </Label>
              <div className=" space-y-spacing-sm">
                <InputGroup className="h-10 rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupInput
                    type="text"
                    placeholder="Eg. https://linkedin.com/in/your-profile"
                    {...register('linkedIn')}
                    className="text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                  />
                </InputGroup>
                {errors.linkedIn && (
                  <p className="text-sm text-red-500">
                    {errors.linkedIn.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-spacing-xs col-span-2">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Description
              </Label>
              <div className=" space-y-spacing-sm ">
                <InputGroup className="rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupTextarea
                    placeholder="Write here..."
                    {...register('description')}
                    className="min-h-[136px] text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                  />
                </InputGroup>
                {errors.description && (
                  <p className="text-sm text-red-500">
                    {errors.description.message}
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
