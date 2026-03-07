'use client';
import React, { useState } from 'react';
import { Stepper } from './stepper';
import JobInformationForm from './steps/job-information-form';
import ReviewJobDescriptionForm from './steps/review-job-description-form';
import BusinessInformationForm from './steps/business-information-form';
import Preview from './preview/preview';
import { useCreateJob } from '@/services/jobs/jobs.client';
import { FormProvider } from 'react-hook-form';

const steps = [
  { id: 1, label: 'Job Information' },
  { id: 2, label: 'Review Job Description' },
  { id: 3, label: 'Business Information' },
  { id: 4, label: 'Preview' },
];
export default function CreateForm() {
  const { onSubmit, step, nextStep, prevStep, methods } = useCreateJob();
  return (
    <div>
      <Stepper steps={steps} currentStep={step} className="mb-12" />
      <FormProvider {...methods}>
        <form
          onSubmit={onSubmit}
          className=" flex flex-col gap-y-spacing-6xl flex-1"
        >
          {step === 1 && <JobInformationForm next={nextStep} />}
          {step === 2 && (
            <ReviewJobDescriptionForm prev={prevStep} next={nextStep} />
          )}
          {step === 3 && (
            <BusinessInformationForm prev={prevStep} next={nextStep} />
          )}
          {step === 4 && <Preview prev={prevStep} />}
        </form>
      </FormProvider>
    </div>
  );
}
