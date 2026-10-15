'use client';
import React, { useState } from 'react';
import { Stepper } from './stepper';
import JobInformationForm from './steps/job-information-form';
import JobDescriptionForm from './steps/job-description-form';
import Preview from './preview/preview';
import { StepsSidebar } from './steps-sidebar';
import AdditionalQueries from './steps/additional-queries';
import SkillsRequirementsStep from './steps/skills-requirements-step';
import ValuesPotentialsStep from './steps/values-potentials-step';
import { JobData } from '@/services/jobs/job.type';

const FORM_STEPS = [
  { id: 1, label: 'Basic Info' },
  { id: 2, label: 'Job Description' },
  { id: 3, label: 'Skills' },
  { id: 4, label: 'Values' },
  { id: 5, label: 'Queries' },
];

export default function EditForm({
  defaultValues,
}: {
  defaultValues: JobData;
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(defaultValues);

  return (
    <div className="min-h-screen flex flex-col xl:flex-row items-stretch gap-spacing-2xl xl:gap-spacing-4xl">
      <div className="flex flex-col gap-y-spacing-4xl sm:gap-y-spacing-6xl flex-1 pt-spacing-2xl sm:pt-spacing-4xl pb-spacing-6xl w-full min-w-0">
        {step !== 6 && (
          <div className="block xl:hidden">
            <Stepper steps={FORM_STEPS} currentStep={step} />
          </div>
        )}
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
          <SkillsRequirementsStep
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
          <ValuesPotentialsStep
            prev={(data) => {
              setFormData((prev) => ({ ...prev, ...data }));
              setStep(3);
            }}
            next={(data) => {
              setFormData((prev) => ({ ...prev, ...data }));
              setStep(5);
            }}
            defaultValues={formData}
          />
        )}
        {step === 5 && (
          <AdditionalQueries
            prev={(data) => {
              setFormData((prev) => ({ ...prev, ...data }));
              setStep(4);
            }}
            next={(data) => {
              setFormData((prev) => ({ ...prev, ...data }));
              setStep(6);
            }}
            defaultValues={formData}
          />
        )}
        {step === 6 && (
          <Preview prev={() => setStep(5)} defaultValues={formData} />
        )}
      </div>
      {step !== 6 && (
        <StepsSidebar currentStep={step} className="hidden xl:block" />
      )}
    </div>
  );
}
