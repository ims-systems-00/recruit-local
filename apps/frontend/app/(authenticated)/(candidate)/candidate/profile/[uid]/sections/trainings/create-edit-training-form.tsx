'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Controller, FormProvider, Resolver, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { format, parse } from 'date-fns';
import { CalendarDays, CloudUpload } from 'lucide-react';
import type { FileRejection } from 'react-dropzone';
import { TRAINING_SKILLS_MAX } from '@rl/types';

import { Label } from '@/components/ui/label';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import FileUploader, { UploadedFile } from '@/components/file-uploader';
import AttachmentItem from '@/components/attachment-item';
import CatalogueSkillTags from '@/components/skills/catalogue-skill-tags';
import {
  deleteFileStorage,
  useDeleteFileStorage,
} from '@/services/file-storage';
import { cn } from '@/lib/utils';
import {
  TrainingData,
  TrainingFormValues,
  trainingFormSchema,
  useCreateTraining,
  useUpdateTraining,
} from '@/services/training';

const CERTIFICATE_MAX_BYTES = 10 * 1024 * 1024;
const CERTIFICATE_ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    '.docx',
  ],
};

// Dates are kept as "yyyy-MM-dd" — a calendar day, which no timezone can shift.
const toDay = (date: Date) => format(date, 'yyyy-MM-dd');
const fromDay = (day?: string | null) =>
  day ? parse(day.slice(0, 10), 'yyyy-MM-dd', new Date()) : undefined;

const rejectionMessage = (rejections: FileRejection[]) => {
  const code = rejections[0]?.errors[0]?.code;
  if (code === 'file-too-large') return 'The file must be 10MB or smaller.';
  if (code === 'file-invalid-type') return 'Upload a PDF, DOC or DOCX file.';
  return 'This file cannot be uploaded.';
};

const labelClassName =
  ' text-label-sm font-label-sm-strong! text-text-gray-secondary';
const inputGroupClassName =
  'h-10 rounded-lg shadow-xs border-border-gray-primary';
const inputClassName =
  ' text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary';

function RequiredMark() {
  return <span className="text-text-brand-primary">*</span>;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-text-error-primary">{message}</p>;
}

function DateField({
  id,
  value,
  onChange,
  disabledBefore,
  invalid,
}: {
  id: string;
  value?: string;
  onChange: (day: string | undefined) => void;
  disabledBefore?: Date;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = fromDay(value);

  return (
    <InputGroup
      className={cn(
        inputGroupClassName,
        invalid && ' border-border-error-primary',
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn('justify-start px-2 border-0 w-full', inputClassName)}
          >
            {selected ? (
              format(selected, 'dd/MM/yyyy')
            ) : (
              <span className="text-text-gray-quaternary">Select date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto overflow-hidden p-0 bg-white"
          align="start"
        >
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected ?? disabledBefore}
            captionLayout="dropdown"
            disabled={disabledBefore ? { before: disabledBefore } : undefined}
            onSelect={(date) => {
              onChange(date ? toDay(date) : undefined);
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
  );
}

type CreateEditTrainingFormProps = {
  defaultValues?: TrainingData;
  setOpen: (open: boolean) => void;
  onClearSelectedTraining: () => void;
};

export default function CreateEditTrainingForm({
  defaultValues,
  setOpen,
  onClearSelectedTraining,
}: CreateEditTrainingFormProps) {
  const { uid } = useParams();
  const [certificateError, setCertificateError] = useState<string | null>(null);

  const { createTraining, isPending: isCreatingTraining } = useCreateTraining();
  const { updateTraining, isPending: isUpdatingTraining } = useUpdateTraining();
  const { deleteFile, isLoading: isDeletingFile } = useDeleteFileStorage();

  const methods = useForm<TrainingFormValues>({
    resolver: yupResolver(trainingFormSchema) as Resolver<TrainingFormValues>,
    defaultValues: {
      organizationName: defaultValues?.organizationName ?? '',
      courseName: defaultValues?.courseName ?? '',
      skills:
        defaultValues?.skills?.map(({ _id, name }) => ({ _id, name })) ?? [],
      isCurrentlyEnrolled: defaultValues?.isCurrentlyEnrolled ?? false,
      startDate: defaultValues?.startDate?.slice(0, 10),
      endDate: defaultValues?.endDate?.slice(0, 10),
    },
    mode: 'onSubmit',
  });

  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = methods;

  const isCurrentlyEnrolled = watch('isCurrentlyEnrolled');
  const startDate = watch('startDate');
  const uploadedCertificate = watch('certificateStorage');
  // Removing the saved certificate only takes it off the form; Save sends the
  // removal, so closing without saving keeps it.
  const [isSavedCertificateRemoved, setIsSavedCertificateRemoved] =
    useState(false);
  const savedCertificate = isSavedCertificateRemoved
    ? undefined
    : defaultValues?.certificate?.storageInformation;
  // Save waits for the certificate: sent mid-upload, the training would be
  // saved without it.
  const [isUploadingCertificate, setIsUploadingCertificate] = useState(false);
  const isSaving = isCreatingTraining || isUpdatingTraining;

  const close = () => {
    setOpen(false);
    onClearSelectedTraining();
  };

  const onSubmit = async (data: TrainingFormValues) => {
    // Enter in a text field submits even with Save disabled.
    if (isUploadingCertificate) return;

    // The form holds picked entries for the chips; the API takes their ids.
    const payload = { ...data, skills: data.skills.map((skill) => skill._id) };

    if (defaultValues?._id) {
      await updateTraining({
        id: defaultValues._id,
        // null removes the saved certificate; a new upload replaces it anyway.
        payload:
          isSavedCertificateRemoved && !data.certificateStorage
            ? { ...payload, certificateStorage: null }
            : payload,
        onSuccessCallback: close,
      });
    } else {
      await createTraining({
        payload: { ...payload, jobProfileId: uid as string },
        onSuccessCallback: close,
      });
    }
  };

  // Only a file uploaded in this form is deleted from storage straight away; a
  // saved certificate is removed by the server when the training is saved.
  const removeUploadedCertificate = async (file: UploadedFile) => {
    const res = await deleteFile({ fileKey: file.Key });
    if (res?.success) {
      setValue('certificateStorage', undefined, { shouldDirty: true });
    }
  };

  const onCertificateUpload = (files: UploadedFile[]) => {
    if (!files.length) {
      setCertificateError('Upload failed. Please try again.');
      return;
    }
    // A second upload replaces the first, which is not attached to anything
    // yet. Removed quietly: the user asked for a replacement, not a deletion.
    if (uploadedCertificate?.Key) {
      deleteFileStorage({ fileKey: uploadedCertificate.Key });
    }
    setCertificateError(null);
    setValue('certificateStorage', files[0], { shouldDirty: true });
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-spacing-2xl">
          <div className="grid grid-cols-1 gap-spacing-2xl">
            <div className="space-y-spacing-xs">
              <Label htmlFor="training-organization" className={labelClassName}>
                Organization Name <RequiredMark />
              </Label>
              <div className=" space-y-spacing-sm">
                <InputGroup
                  className={cn(
                    inputGroupClassName,
                    errors.organizationName && ' border-border-error-primary',
                  )}
                >
                  <InputGroupInput
                    id="training-organization"
                    type="text"
                    placeholder=" Eg . Adobe"
                    className={inputClassName}
                    {...register('organizationName')}
                  />
                </InputGroup>
                <FieldError message={errors.organizationName?.message} />
              </div>
            </div>

            <div className="space-y-spacing-xs">
              <Label htmlFor="training-course" className={labelClassName}>
                Course Name <RequiredMark />
              </Label>
              <div className=" space-y-spacing-sm">
                <InputGroup
                  className={cn(
                    inputGroupClassName,
                    errors.courseName && ' border-border-error-primary',
                  )}
                >
                  <InputGroupInput
                    id="training-course"
                    type="text"
                    placeholder=" Eg . Fundamentals of UX Design"
                    className={inputClassName}
                    {...register('courseName')}
                  />
                </InputGroup>
                <FieldError message={errors.courseName?.message} />
              </div>
            </div>

            <div className="space-y-spacing-xs">
              <Label htmlFor="training-skills" className={labelClassName}>
                Skills{' '}
                <span className="font-normal text-text-gray-tertiary">
                  (Limited to {TRAINING_SKILLS_MAX})
                </span>{' '}
                <RequiredMark />
              </Label>
              <div className=" space-y-spacing-sm">
                <Controller
                  name="skills"
                  control={control}
                  render={({ field }) => (
                    <CatalogueSkillTags
                      id="training-skills"
                      value={field.value ?? []}
                      onChange={field.onChange}
                      max={TRAINING_SKILLS_MAX}
                      invalid={!!errors.skills}
                    />
                  )}
                />
                <FieldError message={errors.skills?.message} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Controller
                name="isCurrentlyEnrolled"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="training-currently-enrolled"
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                    className=" data-[state=checked]:bg-bg-brand-solid-primary data-[state=checked]:text-text-white data-[state=checked]:border-bg-brand-solid-primary"
                  />
                )}
              />
              <Label
                htmlFor="training-currently-enrolled"
                className=" text-text-gray-secondary text-label-md font-label-md-strong!"
              >
                I&apos;m currently enrolled
              </Label>
            </div>

            <div className="space-y-spacing-xs">
              <Label htmlFor="training-start-date" className={labelClassName}>
                Start Date <RequiredMark />
              </Label>
              <div className=" space-y-spacing-sm">
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <DateField
                      id="training-start-date"
                      value={field.value}
                      onChange={field.onChange}
                      invalid={!!errors.startDate}
                    />
                  )}
                />
                <FieldError message={errors.startDate?.message} />
              </div>
            </div>

            {/* While enrolled there is no end date; the schema drops any left here. */}
            {!isCurrentlyEnrolled && (
              <div className="space-y-spacing-xs">
                <Label htmlFor="training-end-date" className={labelClassName}>
                  End Date <RequiredMark />
                </Label>
                <div className=" space-y-spacing-sm">
                  <Controller
                    name="endDate"
                    control={control}
                    render={({ field }) => (
                      <DateField
                        id="training-end-date"
                        value={field.value}
                        onChange={field.onChange}
                        disabledBefore={fromDay(startDate)}
                        invalid={!!errors.endDate}
                      />
                    )}
                  />
                  <FieldError message={errors.endDate?.message} />
                </div>
              </div>
            )}

            <div className="space-y-spacing-xs">
              <Label className={labelClassName}>
                Upload Certificate{' '}
                <span className="font-normal text-text-gray-tertiary">
                  (Optional)
                </span>
              </Label>
              <div className=" space-y-spacing-sm">
                <FileUploader
                  onUpload={onCertificateUpload}
                  onReject={(rejections) =>
                    setCertificateError(rejectionMessage(rejections))
                  }
                  accept={CERTIFICATE_ACCEPT}
                  maxSize={CERTIFICATE_MAX_BYTES}
                  onUploadingChange={setIsUploadingCertificate}
                >
                  {({ open, disabled, loading }) => (
                    <div className="flex items-center justify-between gap-spacing-lg p-spacing-lg rounded-lg border border-border-gray-primary shadow-xs">
                      <div className="flex items-center gap-spacing-lg min-w-0">
                        <div className="shrink-0 w-8 h-8 rounded-md border border-border-gray-primary flex items-center justify-center">
                          <CloudUpload className="size-4 text-fg-gray-tertiary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-label-sm font-label-sm-strong! text-text-gray-primary">
                            {loading ? 'Uploading...' : 'Upload Your File'}
                          </p>
                          <p className="text-label-xs text-text-gray-tertiary">
                            DOCS or PDF, up to 10MB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={open}
                        disabled={disabled || isSaving}
                        className=" cursor-pointer shrink-0 h-8 border-border-gray-primary rounded-lg text-label-sm font-label-sm-strong! text-text-gray-primary"
                      >
                        Upload
                      </Button>
                    </div>
                  )}
                </FileUploader>
                <FieldError message={certificateError ?? undefined} />

                {uploadedCertificate?.Key ? (
                  <AttachmentItem
                    item={uploadedCertificate}
                    isDeleting={isDeletingFile}
                    onDelete={removeUploadedCertificate}
                  />
                ) : (
                  savedCertificate?.Key && (
                    <div className=" space-y-spacing-xs">
                      <AttachmentItem
                        item={{
                          Name: savedCertificate.Name ?? 'Certificate',
                          Bucket: savedCertificate.Bucket ?? '',
                          Key: savedCertificate.Key,
                        }}
                        isDeleting={false}
                        onDelete={() => setIsSavedCertificateRemoved(true)}
                      />
                      <p className="text-label-xs text-text-gray-tertiary">
                        Uploading a new file replaces this certificate.
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="flex py-spacing-2xl justify-end mt-spacing-4xl gap-spacing-sm">
            <Button
              type="button"
              variant="outline"
              className=" cursor-pointer border-border-gray-primary h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-primary"
              onClick={close}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || isDeletingFile || isUploadingCertificate}
              className=" cursor-pointer bg-bg-brand-solid-primary h-10 text-white! rounded-lg text-label-sm font-label-sm-strong!"
            >
              {isUploadingCertificate
                ? 'Uploading...'
                : isSaving
                  ? 'Saving...'
                  : 'Save'}
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
