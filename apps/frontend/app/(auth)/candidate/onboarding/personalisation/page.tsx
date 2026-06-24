'use client';
import { useSearchParams } from 'next/navigation';
import { ONBOARDING_STEP_ENUMS } from '@rl/types';
import CvUploadSection from './sections/cv-upload/cv-upload';
import InfoSection from './sections/info';

export default function PersonalisationPage() {
  const searchParams = useSearchParams();
  const step = searchParams.get('step');

  if (step === ONBOARDING_STEP_ENUMS.CV_UPLOAD) {
    return <CvUploadSection />;
  }
  //   if (step === ONBOARDING_STEP_ENUMS.VALUES_STEP_2) {
  //     return <ValuesStepTwoSection />;
  //   }
  //   if (step === ONBOARDING_STEP_ENUMS.VALUES_STEP_3) {
  //     return <ValuesStepThreeSection />;
  //   }
  //   if (step === ONBOARDING_STEP_ENUMS.VALUES_STEP_4) {
  //     return <ValuesStepFourSection />;
  //   }
  //   if (step === ONBOARDING_STEP_ENUMS.VALUES_STEP_5) {
  //     return <ValuesStepFiveSection />;
  //   }
  return <InfoSection />;
}
