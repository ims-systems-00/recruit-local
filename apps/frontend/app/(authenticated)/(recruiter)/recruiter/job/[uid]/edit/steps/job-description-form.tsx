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
