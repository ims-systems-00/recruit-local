'use client';

import React from 'react';

import { Label } from '@/components/ui/label';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { FormProvider, useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';
import * as yup from 'yup';

import {
  StatusCreateInput,
  StatusData,
  StatusUpdateInput,
} from '@/services/status/status.type';
import {
  useCreateStatus,
  useUpdateStatus,
} from '@/services/status/status.client';
import {
  statusCreateSchema,
  statusUpdateSchema,
} from '@/services/status/status.validation';

type CreateEditStatusFormProps = {
  defaultValues?: StatusData;
  setOpen: (open: boolean) => void;
  onClearSelectedStatus?: () => void;
};

export default function CreateEditStatusForm({
  defaultValues,
  setOpen,
  onClearSelectedStatus,
}: CreateEditStatusFormProps) {
  const { uid } = useParams();

  const isEdit = !!defaultValues?._id;

  const schema = isEdit
    ? (statusUpdateSchema as yup.ObjectSchema<StatusUpdateInput>)
    : (statusCreateSchema as yup.ObjectSchema<StatusCreateInput>);

  const { updateStatus, isPending: isUpdatingStatus } = useUpdateStatus();
  const { createStatus, isPending: isCreatingStatus } = useCreateStatus();
  const methods = useForm<StatusCreateInput | StatusUpdateInput>({
    resolver: yupResolver(schema),
    defaultValues: {
      collectionId: defaultValues?._id || (uid as string),
      collectionName: defaultValues?.collectionName || 'jobs',
      label: defaultValues?.label || undefined,
      default: defaultValues?.default || false,
      weight: defaultValues?.weight || 0,
      backgroundColor: defaultValues?.backgroundColor || '#FFFFFF',
    },
    mode: 'onSubmit',
  });

  const {
    register,
    control,
    formState: { errors },
    handleSubmit,
  } = methods;

  const onSubmit = async (data: StatusUpdateInput) => {
    const payload = {
      ...data,
    };

    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(
        ([_, value]) => value !== undefined && value !== null && value !== '',
      ),
    );

    if (defaultValues?._id) {
      await updateStatus({
        id: defaultValues?._id || '',
        payload: cleanPayload,
        // onSuccessCallback: (newData) => {
        //   setOpen(false);
        //   onClearSelectedEducation();
        // },
      });
    } else {
      await createStatus({
        payload: {
          label: cleanPayload.label as string,
          collectionName: 'jobs',
          weight: 0,
          default: false,
          backgroundColor: '#FFFFFF',
          collectionId: uid as string,
        },
        onSuccessCallback: (newData) => {
          setOpen(false);
          onClearSelectedStatus?.();
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
                Label
              </Label>
              <div className=" space-y-spacing-sm">
                <InputGroup
                  className={cn(
                    'h-10 rounded-lg shadow-xs border-border-gray-primary',
                    errors.label && ' border-border-error-primary',
                  )}
                >
                  <InputGroupInput
                    type="text"
                    placeholder=" Eg . Shortlisted, Interviewed, Rejected, etc."
                    className=" text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                    {...register('label')}
                  />
                </InputGroup>
                {errors.label && (
                  <p className="text-xs text-text-error-primary">
                    {errors.label.message}
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
              onClick={() => {
                setOpen(false);
                onClearSelectedStatus?.();
              }}
              disabled={isUpdatingStatus || isCreatingStatus}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUpdatingStatus || isCreatingStatus}
              className=" cursor-pointer bg-bg-brand-solid-primary h-10 text-white! rounded-lg text-label-sm font-label-sm-strong!"
            >
              {isUpdatingStatus || isCreatingStatus ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
