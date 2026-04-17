'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Folder, MailIcon } from 'lucide-react';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import { Controller, useFormContext } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MultiStepJobFormValues } from '../job.schema';

export default function JobDescriptionForm({
  prev,
  next,
}: {
  prev: (step: number) => void;
  next: (step: number) => void;
}) {
  const {
    register,
    control,
    formState: { errors },
    watch,
    getValues,
  } = useFormContext<MultiStepJobFormValues>();
  return (
    <>
      <div className=" space-y-spacing-4xl">
        <div className="space-y-spacing-2xl">
          <p className=" text-label-xl font-label-xl-strong! text-text-gray-primary">
            Job Description
          </p>
          <div className="grid grid-cols-2 gap-spacing-2xl">
            {/* <div className="space-y-spacing-xs ">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Salary Type
              </Label>
              <div className=" space-y-2">
                <Controller
                  name="salary.mode"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="h-10! w-full rounded-lg shadow-xs border-border-gray-primary data-placeholder:text-text-gray-quaternary">
                        <SelectValue placeholder="Eg. Fixed" />
                      </SelectTrigger>

                      <SelectContent className=" bg-white">
                        <SelectGroup>
                          {SALARY_MODE_OPTIONS.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.salary?.mode && (
                  <p className="text-xs text-text-error-primary">
                    {errors.salary?.mode?.message}
                  </p>
                )}
              </div>
            </div>
            {salaryMode === 'negotiable' ? (
              <>
                <div className="space-y-spacing-xs ">
                  <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                    Min. Salary
                  </Label>
                  <div className=" space-y-2">
                    <InputGroup className="h-10 rounded-lg shadow-xs border-border-gray-primary">
                      <InputGroupInput
                        type="number"
                        placeholder="Eg. 100"
                        {...register('salary.min')}
                      />
                    </InputGroup>
                    {errors.salary?.min && (
                      <p className="text-xs text-text-error-primary">
                        {errors.salary?.min.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-spacing-xs ">
                  <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                    Max. Salary
                  </Label>
                  <div className=" space-y-2">
                    <InputGroup className="h-10 rounded-lg shadow-xs border-border-gray-primary">
                      <InputGroupInput
                        type="number"
                        placeholder="Eg. 500"
                        {...register('salary.max')}
                      />
                    </InputGroup>
                    {errors.salary?.max && (
                      <p className="text-xs text-text-error-primary">
                        {errors.salary?.max.message}
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-spacing-xs ">
                <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                  Salary
                </Label>
                <div className=" space-y-2">
                  <InputGroup className="h-10 rounded-lg shadow-xs border-border-gray-primary">
                    <InputGroupInput
                      type="number"
                      placeholder="Eg. 300"
                      {...register('salary.amount')}
                    />
                  </InputGroup>
                  {errors.salary?.amount && (
                    <p className="text-xs text-text-error-primary">
                      {errors.salary?.amount.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div
              className={cn(
                'space-y-spacing-xs ',
                salaryMode !== 'negotiable' && ' col-span-2',
              )}
            >
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Period
              </Label>
              <div className=" space-y-2">
                <Controller
                  name="period"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="h-10! w-full rounded-lg shadow-xs border-border-gray-primary data-placeholder:text-text-gray-quaternary">
                        <SelectValue placeholder="Eg. Hourly" />
                      </SelectTrigger>

                      <SelectContent className=" bg-white">
                        <SelectGroup>
                          {PERIOD_OPTIONS.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.period && (
                  <p className="text-xs text-text-error-primary">
                    {errors.period.message}
                  </p>
                )}
              </div>
            </div> */}
            <div className="space-y-spacing-xs col-span-2">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                About the Role
              </Label>
              <div className=" space-y-2 ">
                <InputGroup className="rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupTextarea
                    placeholder="Write your message here..."
                    {...register('aboutUs')}
                    className="min-h-[136px] "
                  />
                </InputGroup>
                {errors.aboutUs && (
                  <p className="text-xs text-text-error-primary">
                    {errors.aboutUs.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-spacing-xs col-span-2">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Key Responsibility
              </Label>
              <div className=" space-y-2 ">
                <InputGroup className="rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupTextarea
                    placeholder="Write your message here..."
                    {...register('responsibility')}
                    className="min-h-[136px] "
                  />
                </InputGroup>
                {errors.responsibility && (
                  <p className="text-xs text-text-error-primary">
                    {errors.responsibility.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-spacing-xs col-span-2">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Related Attachment
              </Label>
              <div className=" space-y-2 ">
                <div className=" w-full p-spacing-4xl rounded-2xl border border-dashed border-border-gray-secondary flex flex-col justify-center items-center gap-spacing-lg">
                  <div className=" w-10 h-10 border border-others-brand-light flex justify-center items-center  bg-others-brand-brand-zero rounded-lg">
                    <Folder className="text-others-brand-dark fill-others-brand-dark " />
                  </div>
                  <div className=" space-y-spacing-xs text-label-sm text-center">
                    <p>
                      <span className=" text-text-brand-secondary font-label-sm-strong!">
                        Drag & Drop
                      </span>{' '}
                      or Choose File to Upload
                    </p>
                    <p>Supported Format: SVG, JPG, PNG (up to 10mb)</p>
                  </div>
                </div>
              </div>
            </div>
            <div className=" col-span-2 space-y-spacing-xl mb-spacing-sm">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Required Documents
              </Label>
              <div className=" flex gap-spacing-4xl items-center">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="cv"
                    className=" data-[state=checked]:bg-bg-brand-solid-primary data-[state=checked]:text-text-white data-[state=checked]:border-bg-brand-solid-primary"
                  />
                  <Label htmlFor="cv">CV</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="cover_latter"
                    className=" data-[state=checked]:bg-bg-brand-solid-primary data-[state=checked]:text-text-white data-[state=checked]:border-bg-brand-solid-primary"
                  />
                  <Label htmlFor="cover_latter">Cover Latter</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="portfolio"
                    className=" data-[state=checked]:bg-bg-brand-solid-primary data-[state=checked]:text-text-white data-[state=checked]:border-bg-brand-solid-primary"
                  />
                  <Label htmlFor="portfolio">Portfolio(if Available)</Label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex py-spacing-2xl justify-end mt-spacing-4xl gap-spacing-sm">
        <Button
          variant="outline"
          onClick={() => prev(1)}
          className=" border-border-gray-primary h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-primary"
        >
          Previous
        </Button>
        <Button
          onClick={() => next(2)}
          className=" bg-bg-brand-solid-primary h-10 text-white! rounded-lg text-label-sm font-label-sm-strong!"
        >
          Continue
        </Button>
      </div>
    </>
  );
}
