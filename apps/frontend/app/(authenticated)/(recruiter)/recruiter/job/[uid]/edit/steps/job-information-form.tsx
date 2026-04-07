'use client';

import React, { useState } from 'react';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CalendarDays, Folder, MailIcon, MapPinIcon } from 'lucide-react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import { Controller, useFormContext } from 'react-hook-form';
import { MultiStepJobFormValues } from '../job.schema';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  EMPLOYMENT_TYPE,
  PERIOD_ENUMS,
  WORKING_DAYS_ENUMS,
  WORKPLACE_ENUMS,
} from '@rl/types';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

export const EMPLOYMENT_TYPE_OPTIONS = [
  { label: 'Full Time', value: EMPLOYMENT_TYPE.FULL_TIME },
  { label: 'Part Time', value: EMPLOYMENT_TYPE.PART_TIME },
  { label: 'Contract', value: EMPLOYMENT_TYPE.CONTRACT },
  { label: 'Freelance', value: EMPLOYMENT_TYPE.FREELANCE },
  { label: 'Intern', value: EMPLOYMENT_TYPE.INTERN },
];

export const WORKPLACE_OPTIONS = [
  { label: 'Remote', value: WORKPLACE_ENUMS.REMOTE },
  { label: 'Onsite', value: WORKPLACE_ENUMS.ONSITE },
  { label: 'Hybrid', value: WORKPLACE_ENUMS.HYBRID },
];

export const SALARY_MODE_OPTIONS = [
  { label: 'Negotiable', value: 'negotiable' },
  { label: 'Fixed', value: 'fixed' },
];

export const WORKING_DAYS_OPTIONS = [
  { label: 'Monday', value: WORKING_DAYS_ENUMS.MONDAY },
  { label: 'Tuesday', value: WORKING_DAYS_ENUMS.TUESDAY },
  { label: 'Wednesday', value: WORKING_DAYS_ENUMS.WEDNESDAY },
  { label: 'Thursday', value: WORKING_DAYS_ENUMS.THURSDAY },
  { label: 'Friday', value: WORKING_DAYS_ENUMS.FRIDAY },
  { label: 'Saturday', value: WORKING_DAYS_ENUMS.SATURDAY },
  { label: 'Sunday', value: WORKING_DAYS_ENUMS.SUNDAY },
];

export const PERIOD_OPTIONS = [
  { label: 'Hourly', value: PERIOD_ENUMS.HOURLY },
  { label: 'Daily', value: PERIOD_ENUMS.DAILY },
  { label: 'Weekly', value: PERIOD_ENUMS.WEEKLY },
  { label: 'Monthly', value: PERIOD_ENUMS.MONTHLY },
  { label: 'Yearly', value: PERIOD_ENUMS.YEARLY },
];

export default function JobInformationForm({ next }: { next: () => void }) {
  const workingDaysAnchor = useComboboxAnchor();
  const weekendsAnchor = useComboboxAnchor();
  const {
    register,
    control,
    formState: { errors },
    watch,
    getValues,
  } = useFormContext<MultiStepJobFormValues>();

  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);

  const salaryMode = watch('salary.mode');

  return (
    <>
      <div className=" space-y-spacing-4xl">
        {/* <div className="space-y-spacing-2xl">
          <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
            Banner of Job (optional)
          </p>
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
        </div> */}
        <div className="space-y-spacing-2xl">
          <p className=" text-label-xl font-label-xl-strong! text-text-gray-primary">
            Basic Information
          </p>
          <div className="grid grid-cols-2 gap-spacing-2xl">
            <div className="space-y-spacing-xs col-span-2">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Job Title
              </Label>
              <div className=" space-y-2">
                <InputGroup
                  className={cn(
                    'h-10 rounded-lg shadow-xs border-border-gray-primary',
                    errors.title && ' border-border-error-primary',
                  )}
                >
                  <InputGroupInput
                    type="text"
                    placeholder=" Eg . UI/UX Designer Wanted – Join Our Creative Team!"
                    className=" placeholder:text-text-gray-quaternary"
                    {...register('title')}
                  />
                </InputGroup>
                {errors.title && (
                  <p className="text-xs text-text-error-primary">
                    {errors.title.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-spacing-xs ">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Employ Type
              </Label>

              <div className=" space-y-2">
                <Controller
                  name="employmentType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="h-10! w-full rounded-lg shadow-xs border-border-gray-primary data-placeholder:text-text-gray-quaternary">
                        <SelectValue placeholder="Eg. Full Time" />
                      </SelectTrigger>

                      <SelectContent className=" bg-white">
                        <SelectGroup>
                          {EMPLOYMENT_TYPE_OPTIONS.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.employmentType && (
                  <p className="text-xs text-text-error-primary">
                    {errors.employmentType.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-spacing-xs ">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Work palace
              </Label>
              <div className=" space-y-2">
                <Controller
                  name="workplace"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="h-10! w-full rounded-lg shadow-xs border-border-gray-primary data-placeholder:text-text-gray-quaternary">
                        <SelectValue placeholder="Eg. Remote" />
                      </SelectTrigger>

                      <SelectContent className=" bg-white">
                        <SelectGroup>
                          {WORKPLACE_OPTIONS.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.workplace && (
                  <p className="text-xs text-text-error-primary">
                    {errors.workplace.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-spacing-xs ">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Year of Experience
              </Label>
              <div className=" space-y-2">
                <InputGroup className="h-10 rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupInput
                    type="number"
                    placeholder="10"
                    //   {...register('firstName')}
                  />
                </InputGroup>
                {/* {errors.firstName && (
                    <p className="text-xs text-text-error-primary">
                      {errors.firstName.message}
                    </p>
                  )} */}
              </div>
            </div>
            <div className="space-y-spacing-xs ">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Number of vacancy
              </Label>
              <div className=" space-y-2">
                <InputGroup className="h-10 rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupInput
                    type="number"
                    placeholder="05"
                    className=" placeholder:text-text-gray-quaternary"
                    {...register('vacancy')}
                  />
                </InputGroup>
                {errors.vacancy && (
                  <p className="text-xs text-text-error-primary">
                    {errors.vacancy.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-spacing-xs ">
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
            </div>
            <div className="space-y-spacing-xs ">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Working Days
              </Label>
              <div className=" space-y-2">
                <Controller
                  name="workingDays"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      multiple
                      items={WORKING_DAYS_OPTIONS}
                      value={field.value || []}
                      onValueChange={field.onChange}
                      autoHighlight
                    >
                      <ComboboxChips
                        ref={workingDaysAnchor}
                        className="w-full focus-within:ring-0! min-h-10! rounded-lg shadow-xs border-border-gray-primary data-placeholder:text-text-gray-quaternary"
                      >
                        <ComboboxValue>
                          {(values: string[]) => (
                            <>
                              {values.map((value) => (
                                <ComboboxChip
                                  key={value}
                                  className={
                                    ' capitalize bg-bg-gray-soft-secondary'
                                  }
                                >
                                  {value}
                                </ComboboxChip>
                              ))}

                              <ComboboxChipsInput
                                placeholder={
                                  !values.length ? 'Eg. Monday, Tuesday' : ''
                                }
                              />
                            </>
                          )}
                        </ComboboxValue>
                      </ComboboxChips>

                      <ComboboxContent
                        anchor={workingDaysAnchor}
                        className={'bg-white ring-border-gray-primary!'}
                      >
                        <ComboboxEmpty>No items found.</ComboboxEmpty>
                        <ComboboxList>
                          {(item) => (
                            <ComboboxItem key={item.value} value={item.value}>
                              {item.label}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  )}
                />
                {errors.workingDays && (
                  <p className="text-xs text-text-error-primary">
                    {errors.workingDays.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-spacing-xs ">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Weekends
              </Label>
              <div className=" space-y-2">
                <Controller
                  name="weekends"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      multiple
                      items={WORKING_DAYS_OPTIONS}
                      value={field.value || []}
                      onValueChange={field.onChange}
                      autoHighlight
                    >
                      <ComboboxChips
                        ref={weekendsAnchor}
                        className="w-full focus-within:ring-0! min-h-10! rounded-lg shadow-xs border-border-gray-primary data-placeholder:text-text-gray-quaternary"
                      >
                        <ComboboxValue>
                          {(values: string[]) => (
                            <>
                              {values.map((value) => (
                                <ComboboxChip
                                  key={value}
                                  className={
                                    ' capitalize bg-bg-gray-soft-secondary'
                                  }
                                >
                                  {value}
                                </ComboboxChip>
                              ))}

                              <ComboboxChipsInput
                                placeholder={!values.length ? 'Eg. Sunday' : ''}
                              />
                            </>
                          )}
                        </ComboboxValue>
                      </ComboboxChips>

                      <ComboboxContent
                        anchor={weekendsAnchor}
                        className={'bg-white ring-border-gray-primary!'}
                      >
                        <ComboboxEmpty>No items found.</ComboboxEmpty>
                        <ComboboxList>
                          {(item) => (
                            <ComboboxItem key={item.value} value={item.value}>
                              {item.label}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  )}
                />
                {errors.weekends && (
                  <p className="text-xs text-text-error-primary">
                    {errors.weekends.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-spacing-xs ">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Working Hours{' '}
              </Label>
              <div className=" space-y-2 ">
                <div className="flex items-end gap-spacing-lg">
                  <Input
                    type="time"
                    step="1"
                    defaultValue="10:30:00"
                    className=" h-10  appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none rounded-lg shadow-xs border-border-gray-primary"
                  />
                  <span>To</span>
                  <Input
                    type="time"
                    step="1"
                    defaultValue="10:30:00"
                    className=" h-10 appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none rounded-lg shadow-xs border-border-gray-primary"
                  />
                </div>
                {/* {errors.weekends && (
                  <p className="text-xs text-text-error-primary">
                    {errors.weekends.message}
                  </p>
                )} */}
              </div>
            </div>

            <div className="space-y-spacing-xs ">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Application End Date
              </Label>
              <div className=" space-y-2">
                <InputGroup className="h-10 rounded-lg shadow-xs border-border-gray-primary">
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="date"
                        className="justify-start font-normal px-2 border-0 w-full"
                      >
                        {date ? date.toLocaleDateString() : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto overflow-hidden p-0 bg-white"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={date}
                        defaultMonth={date}
                        captionLayout="dropdown"
                        onSelect={(date) => {
                          setDate(date);
                          setOpen(false);
                        }}
                        className="bg-white! w-[300px]"
                        classNames={{
                          selected:
                            'bg-bg-brand-solid-primary w-10 h-10 rounded-lg text-white text-label-sm',
                          day: ' w-10 h-10 rounded-lg text-text-gray-secondary text-label-sm hover:bg-bg-brand-solid-primary hover:text-white',
                          weekday:
                            'text-text-gray-secondary text-label-sm h-10 w-10 flex items-center justify-center',
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <InputGroupAddon>
                    <CalendarDays className=" text-fg-gray-tertiary" />
                  </InputGroupAddon>
                </InputGroup>
                {errors.vacancy && (
                  <p className="text-xs text-text-error-primary">
                    {errors.vacancy.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-spacing-2xl">
          <div className=" flex items-center justify-between">
            <p className=" text-label-xl font-label-xl-strong! text-text-gray-primary">
              Organization Information
            </p>
            <div className="flex items-center gap-2">
              <Checkbox
                id="autofill"
                className=" data-[state=checked]:bg-bg-brand-solid-primary data-[state=checked]:text-text-white data-[state=checked]:border-bg-brand-solid-primary"
              />
              <Label htmlFor="autofill">Auto Fill From organization</Label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-spacing-2xl">
            <div className="space-y-spacing-xs col-span-2">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                About Us
              </Label>
              <div className=" space-y-2 ">
                <InputGroup className="rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupTextarea
                    placeholder="Write here..."
                    {...register('aboutUs')}
                    className="min-h-[136px] "
                  />
                </InputGroup>
                {errors.aboutUs && (
                  <p className="text-sm text-red-500">
                    {errors.aboutUs.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-spacing-xs">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Email
              </Label>
              <div className=" space-y-2">
                <InputGroup className="h-10 rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupInput
                    type="text"
                    placeholder="Eg. elena@example.com"
                    {...register('email')}
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

              <div className=" space-y-2">
                <Controller
                  name="number"
                  control={control}
                  // rules={{
                  //   validate: (value) =>
                  //     isValidPhoneNumber(value || '') ||
                  //     'Invalid contact number',
                  // }}
                  render={({ field }) => (
                    <PhoneInput
                      {...field}
                      defaultCountry="GB"
                      international
                      placeholder="Enter contact number"
                      className=" border h-10 rounded-lg shadow-xs border-border-gray-primary w-full"
                    />
                  )}
                />
                {errors.number && (
                  <p className="text-sm text-red-500">
                    {errors.number.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-spacing-xs">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Location
              </Label>
              <div className=" space-y-2">
                <InputGroup className="h-10 rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupInput
                    type="text"
                    placeholder="www.googleMap.com"
                    {...register('location')}
                  />
                  <InputGroupAddon>
                    <MapPinIcon className=" text-fg-gray-tertiary" />
                  </InputGroupAddon>
                </InputGroup>
                {errors.location && (
                  <p className="text-sm text-red-500">
                    {errors.location.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-spacing-xs">
              <Label className=" text-label-sm  text-text-gray-secondary">
                <span className="font-label-sm-strong!">
                  Additional Information of location
                </span>{' '}
                (Optional)
              </Label>
              <div className=" space-y-2">
                <InputGroup className="h-10 rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupInput
                    type="text"
                    placeholder="Eg. elena@example.com"
                    {...register('email')}
                  />
                </InputGroup>
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex py-spacing-2xl justify-end mt-spacing-4xl gap-spacing-sm">
        <Button
          variant="outline"
          disabled
          className=" border-border-gray-primary h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-primary"
        >
          Previous
        </Button>
        <Button
          onClick={next}
          className=" bg-bg-brand-solid-primary h-10 text-white! rounded-lg text-label-sm font-label-sm-strong!"
        >
          Continue
        </Button>
      </div>
    </>
  );
}
