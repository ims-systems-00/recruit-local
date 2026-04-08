'use client';

import React, { useEffect, useState } from 'react';
import 'react-phone-number-input/style.css';
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
import {
  Controller,
  FormProvider,
  Resolver,
  useForm,
  useFormContext,
} from 'react-hook-form';
import {
  JobInformationFormValues,
  jobInformationSchema,
  MultiStepJobFormValues,
} from '../job.schema';
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
import { yupResolver } from '@hookform/resolvers/yup';
import { useUpdateJob } from '@/services/jobs/jobs.client';
import { JobData } from '@/services/jobs/job.type';
import LocationSelector, {
  LocationValue,
} from '@/components/location-selector';

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

export default function JobInformationForm({
  next,
  defaultValues,
}: {
  defaultValues: JobData;
  next: (data: Partial<JobData>) => void;
}) {
  const { updateJob, isPending } = useUpdateJob();
  const weekendsAnchor = useComboboxAnchor();
  const methods = useForm<JobInformationFormValues>({
    resolver: yupResolver(
      jobInformationSchema,
    ) as Resolver<JobInformationFormValues>,
    defaultValues: {
      title: defaultValues?.title || '',
      weekends: (defaultValues?.weekends as WORKING_DAYS_ENUMS[]) || [],
      email: defaultValues?.email,
      workingDays: defaultValues?.workingDays,
      workplace: defaultValues?.workplace,
      yearOfExperience: defaultValues?.yearOfExperience,
      vacancy: defaultValues?.vacancy,
      salary: defaultValues?.salary,
      period: defaultValues?.period,
      endDate: defaultValues?.endDate
        ? new Date(defaultValues?.endDate)
        : undefined,
      workingHours: {
        startTime: defaultValues?.workingHours?.startTime,
        endTime: defaultValues?.workingHours?.startTime,
      },
      aboutUs: defaultValues?.aboutUs,
      number: defaultValues?.number,
      location: defaultValues?.location,
      locationAdditionalInfo:
        defaultValues?.locationAdditionalInfo || undefined,
      employmentType: defaultValues?.employmentType,
    },
    mode: 'onSubmit',
  });

  const {
    register,
    control,
    formState: { errors },
  } = methods;

  const onSubmit = async (data: JobInformationFormValues) => {
    const payload = {
      ...data,
      endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
    };

    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(
        ([_, value]) => value !== undefined && value !== null && value !== '',
      ),
    );

    console.log('payload', cleanPayload);

    await updateJob({
      id: defaultValues._id,
      data: cleanPayload,
      onSuccessNext: (newData) => next(newData),
    });
  };

  const [open, setOpen] = useState(false);

  const autoFill = methods.watch('autoFill');

  useEffect(() => {
    if (autoFill) {
      methods.setValue('aboutUs', '');
      methods.setValue('email', '');
      methods.setValue('number', '');
      methods.setValue('location', '');
    }
  }, [autoFill]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <div className=" space-y-spacing-4xl">
          <div className="space-y-spacing-2xl">
            <p className=" text-label-xl font-label-xl-strong! text-text-gray-primary">
              Basic Information
            </p>
            <div className="grid grid-cols-2 gap-spacing-2xl">
              <div className="space-y-spacing-xs col-span-2">
                <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                  Job Title
                </Label>
                <div className=" space-y-spacing-sm">
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

                <div className=" space-y-spacing-sm">
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
                <div className=" space-y-spacing-sm">
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
                <div className=" space-y-spacing-sm">
                  <InputGroup className="h-10 rounded-lg shadow-xs border-border-gray-primary">
                    <InputGroupInput
                      type="number"
                      placeholder="10"
                      {...register('yearOfExperience')}
                    />
                  </InputGroup>
                  {errors.yearOfExperience && (
                    <p className="text-xs text-text-error-primary">
                      {errors.yearOfExperience.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-spacing-xs ">
                <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                  Number of vacancy
                </Label>
                <div className=" space-y-spacing-sm">
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
                  Salary
                </Label>
                <div className=" space-y-spacing-sm">
                  <InputGroup className="h-10 rounded-lg shadow-xs border-border-gray-primary">
                    <InputGroupInput
                      type="number"
                      placeholder="Eg. 300"
                      {...register('salary')}
                    />
                  </InputGroup>
                  {errors.salary && (
                    <p className="text-xs text-text-error-primary">
                      {errors.salary.message}
                    </p>
                  )}
                </div>
              </div>

              <div className={cn('space-y-spacing-xs ')}>
                <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                  Period
                </Label>
                <div className=" space-y-spacing-sm">
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
                <div className=" space-y-spacing-sm">
                  <InputGroup className="h-10 rounded-lg shadow-xs border-border-gray-primary">
                    <InputGroupInput
                      type="number"
                      placeholder="Eg. 5"
                      {...register('workingDays')}
                    />
                  </InputGroup>
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
                <div className=" space-y-spacing-sm">
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
                                  placeholder={
                                    !values.length ? 'Eg. Sunday' : ''
                                  }
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
                <div className=" space-y-spacing-sm ">
                  <div className="flex items-end gap-spacing-lg">
                    <Input
                      type="time"
                      defaultValue="00:00"
                      {...methods.register('workingHours.startTime')}
                      className=" h-10  appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none rounded-lg shadow-xs border-border-gray-primary"
                    />
                    <span>To</span>
                    <Input
                      type="time"
                      defaultValue="00:00"
                      {...methods.register('workingHours.endTime')}
                      className=" h-10 appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none rounded-lg shadow-xs border-border-gray-primary"
                    />
                  </div>
                  {errors.workingHours?.startTime && (
                    <p className="text-xs text-text-error-primary">
                      {errors.workingHours.startTime.message}
                    </p>
                  )}

                  {errors.workingHours?.endTime && (
                    <p className="text-xs text-text-error-primary">
                      {errors.workingHours.endTime.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-spacing-xs ">
                <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                  Application End Date
                </Label>
                <div className=" space-y-spacing-sm">
                  <InputGroup className="h-10 rounded-lg shadow-xs border-border-gray-primary">
                    <Controller
                      name="endDate"
                      control={control}
                      render={({ field }) => (
                        <Popover open={open} onOpenChange={setOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              id="date"
                              className="justify-start font-normal px-2 border-0 w-full"
                            >
                              {field.value
                                ? field.value.toLocaleDateString()
                                : 'Select date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto overflow-hidden p-0 bg-white"
                            align="start"
                          >
                            <Calendar
                              mode="single"
                              selected={field.value}
                              // defaultMonth={date}
                              captionLayout="dropdown"
                              onSelect={(date) => {
                                field.onChange(date);
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
                      )}
                    />

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
                <Controller
                  name="autoFill"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="autofill"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className=" data-[state=checked]:bg-bg-brand-solid-primary data-[state=checked]:text-text-white data-[state=checked]:border-bg-brand-solid-primary"
                    />
                  )}
                />

                <Label htmlFor="autofill">Auto Fill From organization</Label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-spacing-2xl">
              <div className="space-y-spacing-xs col-span-2">
                <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                  About Us
                </Label>
                <div className=" space-y-spacing-sm ">
                  <InputGroup className="rounded-lg shadow-xs border-border-gray-primary">
                    <InputGroupTextarea
                      placeholder="Write here..."
                      {...register('aboutUs')}
                      className="min-h-[136px] "
                      disabled={autoFill}
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
                <div className=" space-y-spacing-sm">
                  <InputGroup className="h-10 rounded-lg shadow-xs border-border-gray-primary">
                    <InputGroupInput
                      type="text"
                      placeholder="Eg. elena@example.com"
                      {...register('email')}
                      disabled={autoFill}
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
                    name="number"
                    control={control}
                    render={({ field }) => (
                      <PhoneInput
                        {...field}
                        defaultCountry="GB"
                        international
                        placeholder="Enter contact number"
                        disabled={autoFill}
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
                <div className=" space-y-spacing-sm">
                  <Controller
                    control={control}
                    name="location"
                    render={({ field }) => (
                      <LocationSelector
                        defaultValue={field.value}
                        onSelectLocation={(val) => {
                          field.onChange(val.address);
                        }}
                      />
                    )}
                  />
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
                <div className=" space-y-spacing-sm">
                  <InputGroup className="h-10 rounded-lg shadow-xs border-border-gray-primary">
                    <InputGroupInput
                      type="text"
                      placeholder="Eg. elena@example.com"
                      {...register('locationAdditionalInfo')}
                      disabled={autoFill}
                    />
                  </InputGroup>
                  {errors.locationAdditionalInfo && (
                    <p className="text-sm text-red-500">
                      {errors.locationAdditionalInfo.message}
                    </p>
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
            type="submit"
            disabled={isPending}
            className=" cursor-pointer bg-bg-brand-solid-primary h-10 text-white! rounded-lg text-label-sm font-label-sm-strong!"
          >
            {isPending ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
