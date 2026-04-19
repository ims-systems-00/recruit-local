'use client';
import { ApplicationCreateInput } from '@/services/application/application.type';
import { createApplicationSchema } from '@/services/application/application.validation';
import { JobData } from '@/services/jobs/job.type';
import { useParams } from 'next/navigation';
import React from 'react';
import { Controller, FormProvider, Resolver, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useCreateApplication } from '@/services/application/application.client';
import { Label } from '@/components/ui/label';
import {
  InputGroup,
  InputGroupInput,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import { cn, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import AttachmentForm, {
  UploadedFile,
} from '@/app/(authenticated)/(recruiter)/recruiter/job/[uid]/edit/steps/attachment-form';
import AttachmentItem from '@/app/(authenticated)/(recruiter)/recruiter/job/[uid]/edit/steps/attachment-item';
import { useDeleteFileStorage } from '@/services/file-storage/file-storage.client';
import AdditionalQueryField from './additional-query-field';
import { QueryCard } from '@/app/(authenticated)/(recruiter)/recruiter/job/[uid]/edit/steps/additional-queries';
import { QUERY_TYPE_ENUMS } from '@rl/types';

export default function ApplicationsForm({ job }: { job: JobData }) {
  const { uid } = useParams();

  const { createApplication, isLoading: isCreatingApplication } =
    useCreateApplication();

  const { deleteFile, isLoading: isDeleting } = useDeleteFileStorage();

  const methods = useForm<ApplicationCreateInput>({
    resolver: yupResolver(
      createApplicationSchema,
    ) as Resolver<ApplicationCreateInput>,
    mode: 'onSubmit',
    defaultValues: {
      jobId: job._id,
      jobProfileId: uid as string,
      //   answers: job?.additionalQueries?.map((query) => ({
      //     queryId: crypto.randomUUID(),
      //     // queryId: query._id,
      //     answer: query.type === QUERY_TYPE_ENUMS.MULTIPLE_CHOICE ? [] : '',
      //   })),
    },
  });

  const {
    register,
    control,
    formState: { errors },
    handleSubmit,
    watch,
    setValue,
  } = methods;

  console.log('errors', errors);

  const onSubmit = async (data: ApplicationCreateInput) => {
    console.log('data', data);
    const payload = {
      ...data,
    };

    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(
        ([_, value]) => value !== undefined && value !== null && value !== '',
      ),
    );

    await createApplication(cleanPayload as ApplicationCreateInput);
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

  console.log('job?.additionalQueries', job?.additionalQueries);
  return (
    <div className=" space-y-spacing-4xl">
      <div className=" space-y-spacing-2xs">
        <h3 className=" text-label-xl font-label-xl-strong! text-text-gray-primary">
          {job?.title}
        </h3>
        <p className=" capitalize text-label-sm text-text-gray-tertiary">
          Last Updated {formatDate(job?.updatedAt)}
        </p>
      </div>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-spacing-2xl">
            <div className="space-y-spacing-xs ">
              <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Write Cover Letter
              </Label>
              <div className=" space-y-spacing-sm ">
                <InputGroup className="rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupTextarea
                    placeholder="Write your cover letter here..."
                    {...register('coverLetter')}
                    className="min-h-[136px] text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                  />
                </InputGroup>
                {errors.coverLetter && (
                  <p className="text-xs text-text-error-primary">
                    {errors.coverLetter.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-spacing-2xl">
              <p className=" text-label-xl font-label-xl-strong! text-text-gray-primary">
                Application Package
              </p>
              <div className="grid grid-cols-1 gap-spacing-2xl">
                <div className="space-y-spacing-xs ">
                  <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                    Portfolio URL
                  </Label>
                  <div className=" space-y-spacing-sm">
                    <InputGroup
                      className={cn(
                        'h-10 rounded-lg shadow-xs border-border-gray-primary',
                        errors.portfolioUrl && ' border-border-error-primary',
                      )}
                    >
                      <InputGroupInput
                        type="text"
                        placeholder=" Eg . https://your-portfolio.com"
                        className=" text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                        {...register('portfolioUrl')}
                      />
                    </InputGroup>
                    {errors.portfolioUrl && (
                      <p className="text-sm text-red-500">
                        {errors.portfolioUrl.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-spacing-xs ">
                  <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                    Resume/CV
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
                          }}
                        />
                      )}
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
                  </div>
                </div>
              </div>
            </div>
            {/* {Boolean(job?.additionalQueries?.length) && (
              <div className="space-y-spacing-2xl">
                <p className=" text-label-xl font-label-xl-strong! text-text-gray-primary">
                  Additional Queries
                </p>
                <div className="space-y-spacing-2xl">
                  {job?.additionalQueries?.map((query, index) => (
                    <AdditionalQueryField
                      key={index}
                      card={query as Partial<QueryCard>}
                      index={index}
                      control={control}
                    />
                  ))}
                </div>
              </div>
            )} */}

            <div className="space-y-spacing-2xl">
              <p className=" text-label-xl font-label-xl-strong! text-text-gray-primary">
                State Expectation
              </p>
              <div className="grid grid-cols-2 gap-spacing-2xl">
                <div className="space-y-spacing-xs ">
                  <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                    Current Salary
                  </Label>
                  <div className=" space-y-spacing-sm">
                    <InputGroup
                      className={cn(
                        'h-10 rounded-lg shadow-xs border-border-gray-primary',
                        errors.currentSalary && ' border-border-error-primary',
                      )}
                    >
                      <InputGroupInput
                        type="number"
                        step={'any'}
                        placeholder=" Eg . 100000"
                        className=" text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                        {...register('currentSalary')}
                      />
                    </InputGroup>
                    {errors.currentSalary && (
                      <p className="text-label-xs text-text-error-primary">
                        {errors.currentSalary.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-spacing-xs ">
                  <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                    Expected Salary
                  </Label>
                  <div className=" space-y-spacing-sm">
                    <InputGroup
                      className={cn(
                        'h-10 rounded-lg shadow-xs border-border-gray-primary',
                        errors.expectedSalary && ' border-border-error-primary',
                      )}
                    >
                      <InputGroupInput
                        type="number"
                        step={'any'}
                        placeholder=" Eg . 100000"
                        className=" text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                        {...register('expectedSalary')}
                      />
                    </InputGroup>
                    {errors.expectedSalary && (
                      <p className="text-label-xs text-text-error-primary">
                        {errors.expectedSalary.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex py-spacing-2xl justify-end mt-spacing-4xl gap-spacing-sm">
            <Button
              type="button"
              variant="outline"
              className=" cursor-pointer border-border-gray-primary h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-primary"
              //   onClick={() => {
              //     setOpen(false);
              //   }}
              disabled={isCreatingApplication}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreatingApplication}
              className=" cursor-pointer bg-bg-brand-solid-primary h-10 text-white! rounded-lg text-label-sm font-label-sm-strong!"
            >
              {isCreatingApplication ? 'Applying...' : 'Apply'}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
