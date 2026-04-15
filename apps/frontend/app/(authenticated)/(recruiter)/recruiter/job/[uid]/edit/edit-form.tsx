'use client';
import React, { useState } from 'react';
import { Stepper } from './stepper';
import JobInformationForm from './steps/job-information-form';
import JobDescriptionForm from './steps/job-description-form';
import Preview from './preview/preview';
import { StepsSidebar } from './steps-sidebar';
import AdditionalQueries from './steps/additional-queries';
import { JobData } from '@/services/jobs/job.type';

export default function EditForm({
  defaultValues,
}: {
  defaultValues: JobData;
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(defaultValues);

  return (
    <div className="min-h-screen flex items-stretch gap-spacing-4xl">
      <div className=" flex flex-col gap-y-spacing-6xl flex-1 pt-spacing-4xl">
        {step === 1 && (
          <JobInformationForm
            defaultValues={formData}
            next={(data) => {
              setFormData((prev) => ({ ...prev, ...data }));
              setStep(2);
            }}
          />
        )}
        {step === 2 && (
          <JobDescriptionForm
            prev={(data) => {
              setFormData((prev) => ({ ...prev, ...data }));
              setStep(1);
            }}
            next={(data) => {
              setFormData((prev) => ({ ...prev, ...data }));
              setStep(3);
            }}
            defaultValues={formData}
          />
        )}
        {step === 3 && (
          <AdditionalQueries
            prev={(data) => {
              setFormData((prev) => ({ ...prev, ...data }));
              setStep(2);
            }}
            next={(data) => {
              setFormData((prev) => ({ ...prev, ...data }));
              setStep(4);
            }}
            defaultValues={formData}
          />
        )}
        {step === 4 && (
          <Preview prev={() => setStep(3)} defaultValues={formData} />
        )}
      </div>
      {step !== 4 && <StepsSidebar currentStep={step} />}
    </div>
  );
}
