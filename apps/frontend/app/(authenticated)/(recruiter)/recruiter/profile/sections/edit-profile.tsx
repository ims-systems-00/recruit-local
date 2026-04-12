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
import { Controller, FormProvider, Resolver, useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TENANT_TYPE } from '@rl/types';
import { useComboboxAnchor } from '@/components/ui/combobox';
import { yupResolver } from '@hookform/resolvers/yup';
import LocationSelector from '@/components/location-selector';
import { TenantData } from '@/services/tenants/tenants.type';
import { useUpdateTenant } from '@/services/tenants/tenants.client';
import {
  TenantUpdateInput,
  tenantUpdateSchema,
} from '@/services/tenants/tenants.validation';

export const ORG_TYPE_OPTIONS = [
  { label: 'Private', value: TENANT_TYPE.PRIVATE },
  { label: 'Public', value: TENANT_TYPE.PUBLIC },
];

export default function EditProfile({
  defaultValues,
}: {
  defaultValues: TenantData;
}) {
  const { updateTenant, isPending } = useUpdateTenant();
  const weekendsAnchor = useComboboxAnchor();
  const methods = useForm<TenantUpdateInput>({
    resolver: yupResolver(tenantUpdateSchema) as Resolver<TenantUpdateInput>,
    defaultValues: {
      name: defaultValues?.name || '',
      email: defaultValues?.email,
      description: defaultValues?.description,
      phone: defaultValues?.phone,
      officeAddress: defaultValues?.officeAddress,
      type: defaultValues?.type,
      size: defaultValues?.size,
    },
    mode: 'onSubmit',
  });

  const {
    register,
    control,
    formState: { errors },
  } = methods;

  const onSubmit = async (data: TenantUpdateInput) => {
    const payload = {
      ...data,
    };

    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(
        ([_, value]) => value !== undefined && value !== null && value !== '',
      ),
    );

    await updateTenant({
      id: defaultValues._id,
      data: cleanPayload,
      //   onSuccessNext: (newData) => next(newData),
    });
  };
  return (
    <div className=" space-y-spacing-2xl">
      <h4 className=" text-text-gray-secondary text-heading-sm font-heading-sm-strong!">
        Edit Profile
      </h4>
      <FormProvider {...methods}>
        <form id="tenant-edit-form" onSubmit={methods.handleSubmit(onSubmit)}>
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
                        placeholder=" Eg . UI/UX Designer Wanted – Join Our Creative Team!"
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
                            <SelectValue placeholder="Eg. Full Time" />
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
                        placeholder="10"
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
                    <InputGroup className="h-10 rounded-lg shadow-xs border-border-gray-primary">
                      <InputGroupInput
                        type="text"
                        placeholder="Eg. elena@example.com"
                        {...register('industry')}
                        className="text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                      />
                    </InputGroup>
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
                      <p className="text-sm text-red-500">
                        {errors.email.message}
                      </p>
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
                      <p className="text-sm text-red-500">
                        {errors.phone.message}
                      </p>
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
                        placeholder="Eg. elena@example.com"
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
                        placeholder="Eg. elena@example.com"
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
        </form>
      </FormProvider>
    </div>
  );
}
