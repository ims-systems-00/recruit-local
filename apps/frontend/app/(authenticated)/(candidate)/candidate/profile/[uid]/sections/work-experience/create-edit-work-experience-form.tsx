'use client';

import React, { useState } from 'react';
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';

import { Label } from '@/components/ui/label';
import { CalendarDays, MailIcon } from 'lucide-react';
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
  FormProvider,
  Resolver,
  useForm,
  UseFormRegister,
} from 'react-hook-form';
import { cn } from '@/lib/utils';
import {
  EMPLOYMENT_TYPE,
  TENANT_INDUSTRY_ENUMS,
  TENANT_TYPE,
  WORKPLACE_ENUMS,
} from '@rl/types';
import LocationSelector from '@/components/location-selector';
import { JobProfileUpdateInput } from '@/services/job-profile/job-profile.type';
import {
  ExperienceCreateInput,
  experienceCreateSchema,
  ExperienceData,
  ExperienceUpdateInput,
  experienceUpdateSchema,
  useCreateExperience,
  useUpdateExperience,
} from '@/services/experience';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useParams } from 'next/navigation';

export const EMPLOYMENT_TYPE_OPTIONS = [
  { label: 'Contract', value: EMPLOYMENT_TYPE.CONTRACT },
  { label: 'Full Time', value: EMPLOYMENT_TYPE.FULL_TIME },
  { label: 'Part Time', value: EMPLOYMENT_TYPE.PART_TIME },
  { label: 'Freelance', value: EMPLOYMENT_TYPE.FREELANCE },
  { label: 'Intern', value: EMPLOYMENT_TYPE.INTERN },
];

export const WORKPLACE_OPTIONS = [
  { label: 'Remote', value: WORKPLACE_ENUMS.REMOTE },
  { label: 'Onsite', value: WORKPLACE_ENUMS.ONSITE },
  { label: 'Hybrid', value: WORKPLACE_ENUMS.HYBRID },
];

type CreateEditWorkExperienceFormProps = {
  defaultValues?: ExperienceData;
  setOpen: (open: boolean) => void;
};

export default function CreateEditWorkExperienceForm({
  defaultValues,
  setOpen,
}: CreateEditWorkExperienceFormProps) {
  const { uid } = useParams();

  const isEdit = !!defaultValues?._id;

  const { updateExperience, isPending: isUpdatingExperience } =
    useUpdateExperience();
  const { createExperience, isPending: isCreatingExperience } =
    useCreateExperience();
  const methods = useForm<ExperienceCreateInput | ExperienceUpdateInput>({
    resolver: yupResolver(
      isEdit ? experienceUpdateSchema : experienceCreateSchema,
    ) as Resolver<ExperienceCreateInput | ExperienceUpdateInput>,
    defaultValues: {
      company: defaultValues?.company || undefined,
      jobTitle: defaultValues?.jobTitle || undefined,
      location: defaultValues?.location || undefined,
      workplace: defaultValues?.workplace || undefined,
      employmentType: defaultValues?.employmentType || undefined,
      startDate: defaultValues?.startDate || undefined,
      endDate: defaultValues?.endDate || undefined,
      description: defaultValues?.description || undefined,
    },
    mode: 'onSubmit',
  });

  const [openStartDate, setOpenStartDate] = useState(false);
  const [openEndDate, setOpenEndDate] = useState(false);

  const {
    register,
    control,
    formState: { errors },
    handleSubmit,
  } = methods;

  const onSubmit = async (data: ExperienceUpdateInput) => {
    const payload = {
      ...data,
    };

    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(
        ([_, value]) => value !== undefined && value !== null && value !== '',
      ),
    );

    if (defaultValues?._id) {
      await updateExperience({
        id: defaultValues?._id || '',
        payload: cleanPayload,
        onSuccessCallback: (newData) => {
          setOpen(false);
        },
      });
    } else {
      await createExperience({
        payload: {
          jobProfileId: uid as string,
          employmentType: cleanPayload.employmentType as EMPLOYMENT_TYPE,
          workplace: cleanPayload.workplace as WORKPLACE_ENUMS,
          startDate: cleanPayload.startDate
            ? new Date(cleanPayload.startDate as string).toISOString()
            : undefined,
          endDate: cleanPayload.endDate
            ? new Date(cleanPayload.endDate as string).toISOString()
            : undefined,
          company: cleanPayload.company as string,
          jobTitle: cleanPayload.jobTitle as string,
          location: cleanPayload.location as string,
        },
        onSuccessCallback: (newData) => {
          setOpen(false);
        },
      });
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-spacing-2xl">
          <div className="grid grid-cols-1 gap-spacing-2xl">
            <div className="space-y-spacing-xs">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Organization Name
              </Label>
              <div className=" space-y-spacing-sm">
                <InputGroup
                  className={cn(
                    'h-10 rounded-lg shadow-xs border-border-gray-primary',
                    errors.company && ' border-border-error-primary',
                  )}
                >
                  <InputGroupInput
                    type="text"
                    placeholder=" Eg . John Doe"
                    className=" text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                    {...register('company')}
                  />
                </InputGroup>
                {errors.company && (
                  <p className="text-xs text-text-error-primary">
                    {errors.company.message}
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
                    errors.jobTitle && ' border-border-error-primary',
                  )}
                >
                  <InputGroupInput
                    type="text"
                    placeholder=" Eg . Software Engineer"
                    className=" text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                    {...register('jobTitle')}
                  />
                </InputGroup>
                {errors.jobTitle && (
                  <p className="text-xs text-text-error-primary">
                    {errors.jobTitle.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-spacing-xs ">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Employment Type
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
                      <SelectTrigger className="h-10! w-full rounded-lg shadow-xs border-border-gray-primary data-placeholder:text-text-gray-quaternary text-text-gray-primary text-label-md font-label-md-strong!">
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
                Workplace
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
                      <SelectTrigger className="h-10! w-full rounded-lg shadow-xs border-border-gray-primary data-placeholder:text-text-gray-quaternary text-text-gray-primary text-label-md font-label-md-strong!">
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
            <div className="space-y-spacing-xs">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Address
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

            <div className="space-y-spacing-xs ">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Start Date
              </Label>
              <div className=" space-y-spacing-sm">
                <InputGroup className="h-10 rounded-lg shadow-xs border-border-gray-primary">
                  <Controller
                    name="startDate"
                    control={control}
                    render={({ field }) => (
                      <Popover
                        open={openStartDate}
                        onOpenChange={setOpenStartDate}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            id="date"
                            className="justify-start px-2 border-0 w-full text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                          >
                            {field.value
                              ? new Date(field.value).toLocaleDateString()
                              : 'Select date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto overflow-hidden p-0 bg-white"
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            selected={
                              field.value ? new Date(field.value) : undefined
                            }
                            // defaultMonth={date}
                            captionLayout="dropdown"
                            onSelect={(date) => {
                              field.onChange(date);
                              setOpenStartDate(false);
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
                {errors.startDate && (
                  <p className="text-xs text-text-error-primary">
                    {errors.startDate.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-spacing-xs ">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                End Date
              </Label>
              <div className=" space-y-spacing-sm">
                <InputGroup className="h-10 rounded-lg shadow-xs border-border-gray-primary">
                  <Controller
                    name="endDate"
                    control={control}
                    render={({ field }) => (
                      <Popover open={openEndDate} onOpenChange={setOpenEndDate}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            id="date"
                            className="justify-start px-2 border-0 w-full text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                          >
                            {field.value
                              ? new Date(field.value).toLocaleDateString()
                              : 'Select date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto overflow-hidden p-0 bg-white"
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            selected={
                              field.value ? new Date(field.value) : undefined
                            }
                            // defaultMonth={date}
                            captionLayout="dropdown"
                            onSelect={(date) => {
                              field.onChange(date);
                              setOpenEndDate(false);
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
                {errors.endDate && (
                  <p className="text-xs text-text-error-primary">
                    {errors.endDate.message}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex py-spacing-2xl justify-end mt-spacing-4xl gap-spacing-sm">
            <Button
              type="button"
              variant="outline"
              className=" cursor-pointer border-border-gray-primary h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-primary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUpdatingExperience || isCreatingExperience}
              className=" cursor-pointer bg-bg-brand-solid-primary h-10 text-white! rounded-lg text-label-sm font-label-sm-strong!"
            >
              {isUpdatingExperience || isCreatingExperience
                ? 'Saving...'
                : 'Save'}
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
