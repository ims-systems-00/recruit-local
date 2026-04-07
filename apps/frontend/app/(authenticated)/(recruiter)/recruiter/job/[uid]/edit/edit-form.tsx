'use client';
import React, { useState } from 'react';
import { Stepper } from './stepper';
import JobInformationForm from './steps/job-information-form';
import ReviewJobDescriptionForm from './steps/review-job-description-form';
import JobDescriptionForm from './steps/job-description-form';
import Preview from './preview/preview';
import { useCreateJob, useUpdateJob } from '@/services/jobs/jobs.client';
import { FormProvider } from 'react-hook-form';
import { StepsSidebar } from './steps-sidebar';
import AdditionalQueries from './steps/additional-queries';
import { JobData } from '@/services/jobs/job.type';

const steps = [
  { id: 1, label: 'Job Information' },
  { id: 2, label: 'Review Job Description' },
  { id: 3, label: 'Business Information' },
  { id: 4, label: 'Preview' },
];
export default function EditForm({
  defaultValues,
}: {
  defaultValues: JobData;
}) {
  const { onSubmit, step, nextStep, prevStep, methods } = useUpdateJob({
    id: defaultValues._id,
    defaultValues: {
      title: defaultValues.title,
    },
  });
  return (
    <div className="min-h-screen flex items-stretch gap-spacing-4xl">
      <FormProvider {...methods}>
        <form
          onSubmit={onSubmit}
          className=" flex flex-col gap-y-spacing-6xl flex-1 pt-spacing-4xl"
        >
          {step === 1 && <JobInformationForm next={nextStep} />}
          {/* {step === 2 && (
            <ReviewJobDescriptionForm prev={prevStep} next={nextStep} />
          )} */}
          {step === 2 && <JobDescriptionForm prev={prevStep} next={nextStep} />}
          {step === 3 && <AdditionalQueries prev={prevStep} next={nextStep} />}
          {step === 4 && <Preview prev={prevStep} />}
        </form>
      </FormProvider>
      {/* <Stepper steps={steps} currentStep={step} className="mb-12" /> */}
      {step !== 4 && <StepsSidebar currentStep={step} />}
    </div>
  );
}
