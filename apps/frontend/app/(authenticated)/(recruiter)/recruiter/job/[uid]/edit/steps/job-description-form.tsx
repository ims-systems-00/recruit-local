'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Folder, MailIcon, Trash2 } from 'lucide-react';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  JobDescriptionFormValues,
  jobDescriptionSchema,
  MultiStepJobFormValues,
} from '../job.schema';
import { REQUIRED_DOCUMENTS_ENUMS } from '@rl/types';
import { JobData } from '@/services/jobs/job.type';
import { yupResolver } from '@hookform/resolvers/yup';
import { useUpdateJob } from '@/services/jobs/jobs.client';
import AttachmentForm, { UploadedFile } from './attachment-form';
const REQUIRED_DOCUMENTS_OPTIONS = [
  {
    id: REQUIRED_DOCUMENTS_ENUMS.RESUME,
    label: 'CV',
  },
  {
    id: REQUIRED_DOCUMENTS_ENUMS.COVER_LETTER,
    label: 'Cover Letter',
  },
  {
    id: REQUIRED_DOCUMENTS_ENUMS.PORTFOLIO,
    label: 'Portfolio',
  },
  {
    id: REQUIRED_DOCUMENTS_ENUMS.CERTIFICATES,
    label: 'Certificates',
  },
];
export default function JobDescriptionForm({
  next,
  prev,
  defaultValues,
}: {
  next: (data: Partial<JobData>) => void;
  prev: (data: Partial<JobData>) => void;
  defaultValues: JobData;
}) {
  const { updateJob, isPending } = useUpdateJob();

  const methods = useForm<JobDescriptionFormValues>({
    resolver: yupResolver(
      jobDescriptionSchema,
    ) as Resolver<JobDescriptionFormValues>,
    mode: 'onSubmit',
    defaultValues: {
      description: defaultValues?.description || '',
      responsibility: defaultValues?.responsibility || '',
      attachmentsStorage: defaultValues?.attachmentsStorage || [],
      requiredDocuments:
        (defaultValues?.requiredDocuments as REQUIRED_DOCUMENTS_ENUMS[]) || [],
    },
  });

  console.log('defaultValues', defaultValues);

  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = methods;

  const selectedDocs = watch('requiredDocuments') || [];

  const attachments = watch('attachmentsStorage') || [];

  const toggleDocument = (value: REQUIRED_DOCUMENTS_ENUMS) => {
    const exists = selectedDocs.includes(value);

    const updated = exists
      ? selectedDocs.filter((v) => v !== value)
      : [...selectedDocs, value];

    setValue('requiredDocuments', updated, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onSubmit = async (data: JobDescriptionFormValues) => {
    console.log('Job Description Payload:', data);

    await updateJob({
      id: defaultValues._id,
      data: data,
      onSuccessNext: (newData) => next(newData),
    });
  };

  const handlePrev = () => {
    const data = methods.getValues();

    console.log('data', data);

    prev(data as JobData);
  };

  console.log('attachments', attachments);

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <div className=" space-y-spacing-4xl">
          <div className="space-y-spacing-2xl">
            <p className=" text-label-xl font-label-xl-strong! text-text-gray-primary">
              Job Description
            </p>
            <div className="grid grid-cols-2 gap-spacing-2xl">
              <div className="space-y-spacing-xs col-span-2">
                <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                  About the Role
                </Label>
                <div className=" space-y-spacing-sm ">
                  <InputGroup className="rounded-lg shadow-xs border-border-gray-primary">
                    <InputGroupTextarea
                      placeholder="Write your message here..."
                      {...register('description')}
                      className="min-h-[136px] "
                    />
                  </InputGroup>
                  {errors.description && (
                    <p className="text-xs text-text-error-primary">
                      {errors.description.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-spacing-xs col-span-2">
                <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                  Key Responsibility
                </Label>
                <div className=" space-y-spacing-sm ">
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
                <div className=" space-y-spacing-sm ">
                  <Controller
                    name="attachmentsStorage"
                    control={control}
                    defaultValue={[]}
                    render={({ field }) => (
                      <AttachmentForm
                        onUploadFile={(files: UploadedFile[]) => {
                          field.onChange([...(field.value || []), ...files]);
                        }}
                      />
                    )}
                  />
                  {errors.attachmentsStorage && (
                    <p className="text-xs text-text-error-primary">
                      {errors.attachmentsStorage.message}
                    </p>
                  )}

                  <div className=" space-y-spacing-lg">
                    {attachments?.map((item) => (
                      <div
                        key={item.Key}
                        className=" p-spacing-2xl rounded-2xl bg-bg-gray-soft-primary border border-border-gray-secondary flex justify-between gap-spacing-2xl"
                      >
                        <div className=" flex gap-spacing-lg items-center ">
                          <div className=" min-w-10 w-10 h-10 flex items-center justify-center relative">
                            <svg
                              width="30"
                              height="40"
                              viewBox="0 0 30 40"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M29.9998 7.95719V36C29.9998 38.2091 28.209 40 25.9998 40H4C1.79086 40 0 38.2091 0 36V4C0 1.79086 1.79086 0 4 0H21.3367L29.9998 7.95719Z"
                                fill="#F6339A"
                              />
                            </svg>
                            <p className=" absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 text-white text-[9px]">
                              {item.type}
                            </p>
                          </div>
                          <div className=" space-y-spacing-3xs">
                            <p className=" text-label-sm font-label-sm-strong! text-text-gray-primary">
                              {item.Name}
                            </p>
                            <p className=" text-label-sm text-text-gray-tertiary">
                              {item.size}
                            </p>
                          </div>
                        </div>
                        <span>
                          <Trash2
                            size={16}
                            className=" text-fg-gray-tertiary"
                          />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className=" col-span-2 space-y-spacing-xl mb-spacing-sm">
                <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                  Required Documents
                </Label>
                <div className=" space-y-spacing-sm">
                  <div className=" flex gap-spacing-4xl items-center">
                    {REQUIRED_DOCUMENTS_OPTIONS.map((item) => {
                      const checked = selectedDocs.includes(item.id);
                      return (
                        <div key={item.id} className="flex items-center gap-2">
                          <Checkbox
                            id={item.id}
                            checked={checked}
                            onCheckedChange={() => toggleDocument(item.id)}
                            className=" data-[state=checked]:bg-bg-brand-solid-primary data-[state=checked]:text-text-white data-[state=checked]:border-bg-brand-solid-primary"
                          />
                          <Label htmlFor={item.id}>{item.label}</Label>
                        </div>
                      );
                    })}
                  </div>
                  {errors.requiredDocuments && (
                    <p className="text-xs text-text-error-primary">
                      {errors.requiredDocuments.message as string}
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
            onClick={handlePrev}
            type="button"
            className=" cursor-pointer border-border-gray-primary h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-primary"
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
