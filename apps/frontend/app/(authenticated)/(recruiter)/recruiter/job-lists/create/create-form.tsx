'use client';
import React, { useState } from 'react';
import { Stepper } from './stepper';
import JobInformationForm from './steps/job-information-form';
import ReviewJobDescriptionForm from './steps/review-job-description-form';
import BusinessInformationForm from './steps/business-information-form';
import Preview from './preview/preview';

const steps = [
  { id: 1, label: 'Job Information' },
  { id: 2, label: 'Review Job Description' },
  { id: 3, label: 'Business Information' },
  { id: 4, label: 'Preview' },
];
export default function CreateForm() {
  const [currentStep, setCurrentStep] = useState(1);
  return (
    <div>
      <Stepper steps={steps} currentStep={currentStep} className="mb-12" />

      {currentStep === 1 && <JobInformationForm next={setCurrentStep} />}
      {currentStep === 2 && (
        <ReviewJobDescriptionForm prev={setCurrentStep} next={setCurrentStep} />
      )}
      {currentStep === 3 && (
        <BusinessInformationForm prev={setCurrentStep} next={setCurrentStep} />
      )}
      {currentStep === 4 && <Preview prev={setCurrentStep} />}
    </div>
  );
}
