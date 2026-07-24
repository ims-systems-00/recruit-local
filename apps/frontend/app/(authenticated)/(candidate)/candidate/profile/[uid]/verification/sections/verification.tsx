'use client';
import React, { useState } from 'react';
import VerificationInfoCard from './verification-info-card';
import {
  DropletOff,
  File,
  Loader2,
  Mailbox,
  ShieldCheck,
  SquaresIntersect,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { KYC_DOCUMENT_TYPE } from '@rl/types';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { useCreateKyc } from '@/services/kyc/kyc.client';
import { Resolver, useForm } from 'react-hook-form';
import { AwsStorageType, KycCreateInput } from '@/services/kyc/kyc.type';
import { yupResolver } from '@hookform/resolvers/yup';
import { kycCreateValidationSchema } from '@/services/kyc';
import { UploadedFile } from '@/components/attachment-form';
import AttachmentForm from '@/components/attachment-form';
import { useDeleteFileStorage } from '@/services/file-storage/file-storage.client';
import AttachmentItem from '@/components/attachment-item';

const documentTypes = [
  {
    name: 'National Insurance Number',
    value: KYC_DOCUMENT_TYPE.NATIONAL_INSURANCE_NUMBER,
  },
  {
    name: 'Verify using Driving License',
    value: KYC_DOCUMENT_TYPE.DRIVER_LICENSE,
  },
  {
    name: 'Verify using National ID card',
    value: KYC_DOCUMENT_TYPE.ID_CARD,
  },
  {
    name: 'Verify using Passport',
    value: KYC_DOCUMENT_TYPE.PASSPORT,
  },
];

export default function Verification({ profileUid }: { profileUid: string }) {
  const router = useRouter();
  const { deleteFile, isLoading: isDeleting } = useDeleteFileStorage();
  const [firstStep, setFirstStep] = useState(true);

  const { createKyc, isSubmitting: isCreatingKyc } = useCreateKyc();
  const methods = useForm<KycCreateInput>({
    resolver: yupResolver(
      kycCreateValidationSchema,
    ) as Resolver<KycCreateInput>,
    defaultValues: {
      documentType: KYC_DOCUMENT_TYPE.NATIONAL_INSURANCE_NUMBER,
    },
    mode: 'onSubmit',
  });

  const {
    register,
    control,
    formState: { errors },
    handleSubmit,
    watch,
    setValue,
    reset,
  } = methods;

  console.log(errors, 'errors');

  const onSubmit = async (data: KycCreateInput) => {
    const isNationalInsuranceNumber =
      data.documentType === KYC_DOCUMENT_TYPE.NATIONAL_INSURANCE_NUMBER;
    await createKyc({
      payload: {
        documentType: data.documentType,
        nationalInsuranceNumber: isNationalInsuranceNumber
          ? data.nationalInsuranceNumber
          : undefined,
        documentFrontStorage: isNationalInsuranceNumber
          ? undefined
          : data.documentFrontStorage,
        documentBackStorage: isNationalInsuranceNumber
          ? undefined
          : data.documentBackStorage,
      },
      onSuccessCallback: () => {
        setFirstStep(true);
        // router.push(`/candidate/profile/${profileUid}`);
        reset();
      },
    });
  };

  const handleRemoveAttachment = async (
    item: UploadedFile,
    storageType: 'documentFrontStorage' | 'documentBackStorage',
  ) => {
    try {
      const res = await deleteFile({
        fileKey: item.Key,
      });

      if (res?.success) {
        setValue(storageType, undefined);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectedDocumentType = watch('documentType');

  const documentFrontStorage = watch('documentFrontStorage');
  const documentBackStorage = watch('documentBackStorage');

  return (
    <div className=" p-spacing-4xl space-y-spacing-4xl">
      <div className="flex justify-between items-center">
        <div className=" space-y-spacing-2xs">
          <h3 className=" text-label-xl font-label-xl-strong! text-text-gray-primary">
            Profile Verification
          </h3>
          <p className=" capitalize text-label-sm text-text-gray-tertiary">
            Make Strong bond by verifying your Account
          </p>
        </div>
        {!firstStep && (
          <div className="flex items-center gap-spacing-sm">
            <Button
              variant="outline"
              className="text-label-md font-label-md-strong! cursor-pointer border-border-gray-primary h-10 rounded-lg text-text-gray-secondary"
              onClick={() => router.push(`/candidate/profile/${profileUid}`)}
              disabled={isCreatingKyc}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              className="bg-bg-brand-solid-primary text-white! text-label-md font-label-md-strong! cursor-pointer h-10 rounded-lg"
            >
              {isCreatingKyc && <Loader2 className="size-4 animate-spin" />}
              {isCreatingKyc ? 'Submitting...' : 'Submit Now'}
            </Button>
          </div>
        )}
      </div>

      {firstStep ? (
        <>
          <div className=" grid md:grid-cols-2 gap-spacing-4xl">
            <VerificationInfoCard
              icon={<File className="size-6 text-fg-gray-secondary" />}
              title="Required Document"
              description="Submit a valid NID , Passport , Driving License or National Insurance Number  (clear and not expired)."
            />
            <VerificationInfoCard
              icon={
                <SquaresIntersect className="size-6 text-fg-gray-secondary" />
              }
              title="Information Match"
              description="The name and date of birth must match your profile details."
            />
            <VerificationInfoCard
              icon={<DropletOff className="size-6 text-fg-gray-secondary" />}
              title="Document Quality"
              description="Blurry, cropped, or edited documents may be rejected."
            />
            <VerificationInfoCard
              icon={<ShieldCheck className="size-6 text-fg-gray-secondary" />}
              title="Compliance"
              description="False documents may result in permanent account suspension."
            />
          </div>

          <div className=" flex justify-end items-center gap-spacing-sm">
            <Button
              variant="outline"
              onClick={() => router.push(`/candidate/profile/${profileUid}`)}
              className="text-label-md font-label-md-strong! cursor-pointer border-border-gray-primary h-10 rounded-lg text-text-gray-secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={() => setFirstStep(false)}
              className="bg-bg-brand-solid-primary text-white! text-label-md font-label-md-strong! cursor-pointer h-10 rounded-lg"
            >
              I understand , Continue
            </Button>
          </div>
        </>
      ) : (
        <div className="space-y-spacing-4xl">
          <div className="space-y-spacing-xs">
            <p className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
              Submit Documents
            </p>
            <RadioGroup
              value={watch('documentType') || ''}
              onValueChange={(value) => {
                reset();
                setValue('documentType', value as KYC_DOCUMENT_TYPE, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
              className=" grid md:grid-cols-2 gap-spacing-2xl"
            >
              {documentTypes.map((item) => (
                <div
                  key={item.value}
                  className="flex items-center gap-spacing-lg p-spacing-2xl rounded-2xl border border-border-gray-secondary min-h-14"
                >
                  <RadioGroupItem value={item.value} id={item.value} />
                  <Label
                    htmlFor={item.value}
                    className={cn(
                      ' w-full flex items-center justify-between gap-spacing-sm text-label-md font-label-md-strong! text-text-gray-secondary',
                    )}
                  >
                    <span>{item.name}</span>
                    {item.value ===
                      KYC_DOCUMENT_TYPE.NATIONAL_INSURANCE_NUMBER && (
                      <span className=" h-6 px-spacing-md py-spacing-3xs border border-border-gray-primary rounded-full bg-others-gray-gray-zero inline-flex items-center justify-center text-label-sm font-label-sm-strong! text-text-gray-secondary">
                        Recommended
                      </span>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div>
            {selectedDocumentType ===
            KYC_DOCUMENT_TYPE.NATIONAL_INSURANCE_NUMBER ? (
              <div className="space-y-spacing-xs">
                <Label className="text-label-sm font-label-sm-strong!">
                  National ID Insurance Number
                </Label>
                <div className=" space-y-spacing-sm">
                  <InputGroup className="h-10 rounded-lg shadow-xs border-border-gray-primary">
                    <InputGroupInput
                      type="text"
                      placeholder="XXXXXXXXX"
                      {...register('nationalInsuranceNumber')}
                    />
                  </InputGroup>
                  {errors.nationalInsuranceNumber && (
                    <p className="text-sm text-text-error-primary">
                      {errors.nationalInsuranceNumber.message}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className=" space-y-spacing-2xl">
                <div className="space-y-spacing-xs">
                  <Label className="text-label-sm font-label-sm-strong!">
                    Document Front
                  </Label>
                  <div className=" space-y-spacing-sm">
                    <AttachmentForm
                      onUploadFile={(files: UploadedFile[]) => {
                        setValue(
                          'documentFrontStorage',
                          files[0] as AwsStorageType,
                        );
                      }}
                      multiple={false}
                      accept={{
                        'image/jpeg': ['.jpg', '.jpeg'],
                        'image/png': ['.png'],
                      }}
                    />
                    {documentFrontStorage?.Key && (
                      <AttachmentItem
                        key={documentFrontStorage?.Key}
                        isDeleting={isDeleting}
                        item={documentFrontStorage as UploadedFile}
                        onDelete={(item) =>
                          handleRemoveAttachment(item, 'documentFrontStorage')
                        }
                      />
                    )}
                    {errors.documentFrontStorage && (
                      <p className="text-sm text-text-error-primary">
                        {errors.documentFrontStorage.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-spacing-xs">
                  <Label className="text-label-sm font-label-sm-strong!">
                    Document Back
                  </Label>
                  <div className=" space-y-spacing-sm">
                    <AttachmentForm
                      onUploadFile={(files: UploadedFile[]) => {
                        setValue(
                          'documentBackStorage',
                          files[0] as AwsStorageType,
                        );
                      }}
                      multiple={false}
                      accept={{
                        'image/jpeg': ['.jpg', '.jpeg'],
                        'image/png': ['.png'],
                      }}
                    />
                    {documentBackStorage?.Key && (
                      <AttachmentItem
                        key={documentBackStorage?.Key}
                        isDeleting={isDeleting}
                        item={documentBackStorage as UploadedFile}
                        onDelete={(item) =>
                          handleRemoveAttachment(item, 'documentBackStorage')
                        }
                      />
                    )}
                    {errors.documentBackStorage && (
                      <p className="text-sm text-text-error-primary">
                        {errors.documentBackStorage.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
