'use client';
import { Progress } from '@/components/ui/progress';
import AttachmentForm, {
  UploadedFile,
} from '@/app/(authenticated)/(recruiter)/recruiter/job/[uid]/edit/steps/attachment-form';
import { Button } from '@/components/ui/button';
import { useDeleteFileStorage } from '@/services/file-storage';
import {
  CvExtractionData,
  ExtractAndCreateCvInput,
} from '@/services/cv/cv.type';
import { useExtractAndCreateCv } from '@/services/cv';
import { useForm } from 'react-hook-form';
import { createCvSchema } from '@/services/cv/cv.validation';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import AttachmentItem from '@/app/(authenticated)/(recruiter)/recruiter/job/[uid]/edit/steps/attachment-item';
import { ONBOARDING_STEP_ENUMS } from '@rl/types';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { jobProfileKeys } from '@/services/job-profile';
import {
  Industry,
  JobTitle,
  WorkMode,
} from '@/services/job-profile/job-profile.type';

export default function CvUploadSection({
  jobProfileId,
  setDataFromCvUpload,
}: {
  jobProfileId: string;
  setDataFromCvUpload: (data: {
    jobTitle: JobTitle[];
    industry: Industry[];
    experienceLevel: string;
    workMode: WorkMode[];
  }) => void;
}) {
  const { deleteFile, isLoading: isDeleting } = useDeleteFileStorage();
  const queryClient = useQueryClient();
  const router = useRouter();
  const schema = createCvSchema as yup.ObjectSchema<ExtractAndCreateCvInput>;

  const { extractAndCreateCv, isPending: isCreatingCv } =
    useExtractAndCreateCv();
  const methods = useForm<ExtractAndCreateCvInput>({
    resolver: yupResolver(schema),
    defaultValues: {
      jobProfileId: jobProfileId,
      resumeStorage: undefined,
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
  } = methods;

  const onSubmit = async (data: ExtractAndCreateCvInput) => {
    console.log(data);
    const payload = {
      payload: data,
      onSuccessCallback: (data: CvExtractionData) => {
        console.log(data, 'data');
        setDataFromCvUpload({
          jobTitle: data.jobTitles,
          industry: data.industries,
          experienceLevel: data.experienceLevels?.[0]?.name || '',
          workMode: data.workModes,
        });
        router.push(
          `/candidate/onboarding/personalisation?step=${ONBOARDING_STEP_ENUMS.JOB_TITLE}`,
        );
      },
    };
    extractAndCreateCv(payload);
  };

  const resumeStorage =
    watch('resumeStorage') || (null as unknown as UploadedFile);

  const handleRemoveAttachment = async (item: UploadedFile) => {
    try {
      const res = await deleteFile({
        fileKey: item.Key,
      });

      if (res?.success) {
        setValue('resumeStorage', null as unknown as UploadedFile, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  console.log('errors', errors);

  return (
    <div className=" flex justify-center items-center">
      <div className=" w-[692px] bg-bg-gray-soft-primary rounded-lg flex flex-col items-center justify-center gap-y-spacing-4xl p-spacing-5xl">
        <div className="w-full flex items-center justify-between gap-spacing-lg">
          <Progress value={10} className="w-full h-2.5" />
          <span className=" text-label-xs font-label-xs-strong! text-text-gray-secondary">
            10%
          </span>
        </div>
        <div className="w-full space-y-spacing-2xs">
          <h4 className=" text-label-xl font-label-xl-strong! text-text-gray-secondary">
            Upload Your CV to Get Started
          </h4>
          <p className=" text-label-sm text-text-gray-quaternary">
            Upload one CV, and Alice AI will pre-fill your details. Just review,
            edit, and continue.
          </p>
        </div>
        <AttachmentForm
          onUploadFile={(files: UploadedFile[]) => {
            setValue('resumeStorage', files[0] as UploadedFile, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
          multiple={false}
          accept={{
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc', '.docx'],
          }}
        />
        {errors.resumeStorage && (
          <p className="text-xs text-text-error-primary">
            {errors.resumeStorage.message}
          </p>
        )}
        {resumeStorage?.Key && (
          <AttachmentItem
            key={resumeStorage?.Key}
            isDeleting={isDeleting}
            item={resumeStorage as UploadedFile}
            onDelete={handleRemoveAttachment}
          />
        )}
        <div className=" w-full flex justify-end">
          <Button
            disabled={isCreatingCv || !resumeStorage?.Key}
            onClick={handleSubmit(onSubmit)}
            className=" cursor-pointer text-base bg-bg-brand-solid-primary border-primary text-white rounded-lg h-10"
          >
            {isCreatingCv ? 'Analysing CV...' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
