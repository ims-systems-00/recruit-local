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
import { useDeleteFileStorage } from '@/services/file-storage';
import AttachmentItem from './attachment-item';
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
  const { deleteFile, isLoading: isDeleting } = useDeleteFileStorage();
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
    const payload = {
      ...data,
      attachmentsStorage:
        data?.attachmentsStorage?.map(({ Key, Bucket, Name }) => ({
          Key,
          Bucket,
          Name,
        })) || [],
    };

    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(
        ([_, value]) => value !== undefined && value !== null && value !== '',
      ),
    );

    await updateJob({
      id: defaultValues._id,
      data: cleanPayload,
      onSuccessNext: (newData) => next(newData),
    });
  };

  const handlePrev = () => {
    const data = methods.getValues();

    console.log('data', data);

    prev(data as JobData);
  };

  console.log('attachments', attachments);

  const handleRemoveAttachment = async (item: UploadedFile) => {
    try {
      const res = await deleteFile({
        fileKey: item.Key,
      });

      if (res?.success) {
        const updated = attachments.filter((file) => file.Key !== item.Key);

        setValue('attachmentsStorage', updated, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    } catch (err) {
      console.error(err);
    }
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
                      className="min-h-[136px] text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
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
                      className="min-h-[136px] text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
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
                          const current =
                            methods.getValues('attachmentsStorage') || [];
                          field.onChange([...current, ...files]);
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
                      <AttachmentItem
                        key={item.Key}
                        isDeleting={isDeleting}
                        item={item}
                        onDelete={handleRemoveAttachment}
                      />
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
                          <Label
                            htmlFor={item.id}
                            className=" text-label-md font-label-md-strong! text-text-gray-secondary"
                          >
                            {item.label}
                          </Label>
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
