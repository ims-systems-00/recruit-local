'use client';

import React, { useState } from 'react';

import { Label } from '@/components/ui/label';
import { CalendarDays } from 'lucide-react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Controller, FormProvider, Resolver, useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useParams } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckedState } from '@radix-ui/react-checkbox';
import {
  EducationCreateInput,
  educationCreateSchema,
  EducationData,
  EducationUpdateInput,
  educationUpdateSchema,
  useCreateEducation,
  useUpdateEducation,
} from '@/services/education';

type CreateEditEducationQualificationFormProps = {
  defaultValues?: EducationData;
  setOpen: (open: boolean) => void;
  onClearSelectedEducation: () => void;
};

export default function CreateEditEducationQualificationForm({
  defaultValues,
  setOpen,
  onClearSelectedEducation,
}: CreateEditEducationQualificationFormProps) {
  const { uid } = useParams();

  const isEdit = !!defaultValues?._id;

  const { updateEducation, isPending: isUpdatingEducation } =
    useUpdateEducation();
  const { createEducation, isPending: isCreatingEducation } =
    useCreateEducation();
  const methods = useForm<EducationCreateInput | EducationUpdateInput>({
    resolver: yupResolver(
      isEdit ? educationUpdateSchema : educationCreateSchema,
    ) as Resolver<EducationCreateInput | EducationUpdateInput>,
    defaultValues: {
      jobProfileId: isEdit ? undefined : (uid as string),
      institution: defaultValues?.institution || undefined,
      degree: defaultValues?.degree || undefined,
      fieldOfStudy: defaultValues?.fieldOfStudy || undefined,
      startDate: defaultValues?.startDate as string | undefined,
      endDate: defaultValues?.endDate as string | undefined,
      grade: defaultValues?.grade as string | undefined,
      description: defaultValues?.description as string | undefined,
    },
    mode: 'onSubmit',
  });

  const [openStartDate, setOpenStartDate] = useState(false);
  const [openEndDate, setOpenEndDate] = useState(false);
  const [isCurrentWorkplace, setIsCurrentWorkplace] =
    useState<CheckedState>(false);
  const {
    register,
    control,
    formState: { errors },
    handleSubmit,
  } = methods;

  const onSubmit = async (data: EducationUpdateInput) => {
    const payload = {
      ...data,
    };

    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(
        ([_, value]) => value !== undefined && value !== null && value !== '',
      ),
    );

    if (defaultValues?._id) {
      await updateEducation({
        id: defaultValues?._id || '',
        payload: cleanPayload,
        onSuccessCallback: (newData) => {
          setOpen(false);
          onClearSelectedEducation();
        },
      });
    } else {
      await createEducation({
        payload: {
          ...cleanPayload,
          jobProfileId: uid as string,
          institution: cleanPayload.institution as string,
          degree: cleanPayload.degree as string,
          fieldOfStudy: cleanPayload.fieldOfStudy as string,
          startDate: cleanPayload.startDate as string,
          endDate: cleanPayload.endDate as string,
          grade: cleanPayload.grade as string,
          description: cleanPayload.description as string,
        },
        onSuccessCallback: (newData) => {
          setOpen(false);
          onClearSelectedEducation();
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
                    errors.institution && ' border-border-error-primary',
                  )}
                >
                  <InputGroupInput
                    type="text"
                    placeholder=" Eg . University of California, Los Angeles"
                    className=" text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                    {...register('institution')}
                  />
                </InputGroup>
                {errors.institution && (
                  <p className="text-xs text-text-error-primary">
                    {errors.institution.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-spacing-xs">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Education Level
              </Label>
              <div className=" space-y-spacing-sm">
                <InputGroup
                  className={cn(
                    'h-10 rounded-lg shadow-xs border-border-gray-primary',
                    errors.degree && ' border-border-error-primary',
                  )}
                >
                  <InputGroupInput
                    type="text"
                    placeholder=" Eg . Bachelor of Science"
                    className=" text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                    {...register('degree')}
                  />
                </InputGroup>
                {errors.degree && (
                  <p className="text-xs text-text-error-primary">
                    {errors.degree.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-spacing-xs">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Department
              </Label>
              <div className=" space-y-spacing-sm">
                <InputGroup
                  className={cn(
                    'h-10 rounded-lg shadow-xs border-border-gray-primary',
                    errors.fieldOfStudy && ' border-border-error-primary',
                  )}
                >
                  <InputGroupInput
                    type="text"
                    placeholder=" Eg . Computer Science"
                    className=" text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                    {...register('fieldOfStudy')}
                  />
                </InputGroup>
                {errors.fieldOfStudy && (
                  <p className="text-xs text-text-error-primary">
                    {errors.fieldOfStudy.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-spacing-xs">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Grade
              </Label>
              <div className=" space-y-spacing-sm">
                <InputGroup
                  className={cn(
                    'h-10 rounded-lg shadow-xs border-border-gray-primary',
                    errors.grade && ' border-border-error-primary',
                  )}
                >
                  <InputGroupInput
                    type="number"
                    placeholder=" Eg . 3.80"
                    step={0.01}
                    className=" text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                    {...register('grade')}
                  />
                </InputGroup>
                {errors.grade && (
                  <p className="text-xs text-text-error-primary">
                    {errors.grade.message}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_current_education"
                checked={isCurrentWorkplace}
                onCheckedChange={(checked: CheckedState) => {
                  setIsCurrentWorkplace(checked);
                  if (checked) {
                    methods.setValue('endDate', undefined);
                  }
                }}
                className=" data-[state=checked]:bg-bg-brand-solid-primary data-[state=checked]:text-text-white data-[state=checked]:border-bg-brand-solid-primary"
              />
              <Label
                htmlFor="is_current_education"
                className=" text-text-gray-secondary text-label-md font-label-md-strong!"
              >
                I currently study here
              </Label>
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
            {!isCurrentWorkplace && (
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
                        <Popover
                          open={openEndDate}
                          onOpenChange={setOpenEndDate}
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
            )}
          </div>
          <div className="flex py-spacing-2xl justify-end mt-spacing-4xl gap-spacing-sm">
            <Button
              type="button"
              variant="outline"
              className=" cursor-pointer border-border-gray-primary h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-primary"
              onClick={() => {
                setOpen(false);
                onClearSelectedEducation();
              }}
              disabled={isUpdatingEducation || isCreatingEducation}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUpdatingEducation || isCreatingEducation}
              className=" cursor-pointer bg-bg-brand-solid-primary h-10 text-white! rounded-lg text-label-sm font-label-sm-strong!"
            >
              {isUpdatingEducation || isCreatingEducation
                ? 'Saving...'
                : 'Save'}
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
