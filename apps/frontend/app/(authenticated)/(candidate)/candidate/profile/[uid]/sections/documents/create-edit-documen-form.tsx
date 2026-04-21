'use client';

import React, { useState } from 'react';
import 'react-phone-number-input/style.css';

import { Label } from '@/components/ui/label';
import { Controller, FormProvider, Resolver, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';
import { CheckedState } from '@radix-ui/react-checkbox';
import { Cv, CvCreateInput, CvUpdateInput } from '@/services/cv/cv.type';
import { createCvSchema, updateCvSchema } from '@/services/cv/cv.validation';
import { useCreateCv, useUpdateCv } from '@/services/cv';
import AttachmentForm, {
  UploadedFile,
} from '@/app/(authenticated)/(recruiter)/recruiter/job/[uid]/edit/steps/attachment-form';
import AttachmentItem from '@/app/(authenticated)/(recruiter)/recruiter/job/[uid]/edit/steps/attachment-item';
import { useDeleteFileStorage } from '@/services/file-storage';
import * as yup from 'yup';

type CreateEditDocumentFormProps = {
  defaultValues?: Cv;
  setOpen: (open: boolean) => void;
  onClearSelectedCv: () => void;
};

export default function CreateEditDocumentForm({
  defaultValues,
  setOpen,
  onClearSelectedCv,
}: CreateEditDocumentFormProps) {
  const { uid } = useParams();

  const isEdit = !!defaultValues?._id;
  const { deleteFile, isLoading: isDeleting } = useDeleteFileStorage();

  const schema = isEdit
    ? (updateCvSchema as yup.ObjectSchema<CvUpdateInput>)
    : (createCvSchema as yup.ObjectSchema<CvCreateInput>);

  const { updateCv, isPending: isUpdatingCv } = useUpdateCv();
  const { createCv, isPending: isCreatingCv } = useCreateCv();
  const methods = useForm<CvCreateInput | CvUpdateInput>({
    resolver: yupResolver(schema) as Resolver<CvCreateInput | CvUpdateInput>,
    defaultValues: {
      jobProfileId: uid as string,
      title: 'Untitled CV',
    },
    mode: 'onSubmit',
  });

  const [isCurrentWorkplace, setIsCurrentWorkplace] =
    useState<CheckedState>(false);
  const {
    register,
    control,
    formState: { errors },
    handleSubmit,
    watch,
    setValue,
  } = methods;

  const onSubmit = async (data: CvCreateInput | CvUpdateInput) => {
    const payload = {
      ...data,
    };

    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(
        ([_, value]) => value !== undefined && value !== null && value !== '',
      ),
    );

    if (defaultValues?._id) {
      await updateCv({
        id: defaultValues?._id || '',
        payload: cleanPayload,
        onSuccessCallback: (data: Cv) => {
          setOpen(false);
          onClearSelectedCv();
        },
      });
    } else {
      await createCv({
        payload: {
          ...cleanPayload,
          jobProfileId: uid as string,
          title: 'Untitled CV',
        },
        onSuccessCallback: (data: Cv) => {
          setOpen(false);
          onClearSelectedCv();
        },
      });
    }
  };

  const resumeStorage = watch('resumeStorage') || null;

  const handleRemoveAttachment = async (item: UploadedFile) => {
    try {
      const res = await deleteFile({
        fileKey: item.Key,
      });

      if (res?.success) {
        setValue('resumeStorage', null, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-spacing-2xl">
          <div className="space-y-spacing-xs col-span-2">
            <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
              CV
            </Label>
            <div className=" space-y-spacing-sm ">
              <Controller
                name="resumeStorage"
                control={control}
                defaultValue={null}
                render={({ field }) => (
                  <AttachmentForm
                    onUploadFile={(files: UploadedFile[]) => {
                      field.onChange(files[0] as UploadedFile);
                    }}
                    multiple={false}
                    accept={{
                      'application/pdf': ['.pdf'],
                      'application/msword': ['.doc', '.docx'],
                    }}
                  />
                )}
              />
              {errors.resumeStorage && (
                <p className="text-xs text-text-error-primary">
                  {errors.resumeStorage.message}
                </p>
              )}

              <div className=" space-y-spacing-lg">
                {resumeStorage?.Key && (
                  <AttachmentItem
                    key={resumeStorage?.Key}
                    isDeleting={isDeleting}
                    item={resumeStorage as UploadedFile}
                    onDelete={handleRemoveAttachment}
                  />
                )}
              </div>
            </div>
          </div>
          <div className="flex py-spacing-2xl justify-end mt-spacing-4xl gap-spacing-sm">
            <Button
              type="button"
              variant="outline"
              className=" cursor-pointer border-border-gray-primary h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-primary"
              onClick={() => {
                setOpen(false);
                onClearSelectedCv();
              }}
              disabled={isUpdatingCv || isCreatingCv}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUpdatingCv || isCreatingCv}
              className=" cursor-pointer bg-bg-brand-solid-primary h-10 text-white! rounded-lg text-label-sm font-label-sm-strong!"
            >
              {isUpdatingCv || isCreatingCv ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
