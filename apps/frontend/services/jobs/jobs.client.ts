'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FieldPath, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fullJobSchema,
  MultiStepJobFormValues,
} from '@/app/(authenticated)/(recruiter)/recruiter/job/create/job.schema';
import { createJob } from './jobs.server';

export const stepFields: Record<number, FieldPath<MultiStepJobFormValues>[]> = {
  1: [
    'bannerStorage',
    'title',
    'employmentType',
    'workingHours.startTime',
    'workingHours.endTime',
    'vacancy',
    'location',
    'workplace',
    'workingDays',
    'weekends',
    'salary.mode',
    'salary.amount',
    'salary.min',
    'salary.max',
    'period',
    'description',
    'responsibility',
    'attachmentsStorage',
  ],

  2: [
    'minEducationalQualification.degree',
    'minEducationalQualification.fieldOfStudy',
    'minEducationalQualification.gpa',
    'skills',
    'email',
    'requiredDocuments',
    'startDate',
    'endDate',
  ],

  3: ['number', 'aboutUs', 'autoFill', 'category', 'keywords'],
};

export function useCreateJob() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const methods = useForm({
    resolver: yupResolver(fullJobSchema),
    mode: 'onChange',
    shouldUnregister: false,
  });
  const {
    register,
    handleSubmit,
    trigger,
    control,
    formState: { errors },
  } = methods;

  const mutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      toast.success('Registration completed');
      router.push('/dashboard');
    },
    onError: () => {
      toast.error('Something went wrong');
    },
  });

  const nextStep = async () => {
    const fields = stepFields[step as keyof typeof stepFields];

    const isValid = await trigger(fields);

    console.log('error', isValid, fields);

    if (!isValid) return;

    setStep((prev) => prev + 1);
  };

  const prevStep = () => setStep((prev) => prev - 1);

  const onSubmit = handleSubmit((data) => {
    mutation.mutate(data);
  });

  return {
    step,
    register,
    errors,
    nextStep,
    prevStep,
    onSubmit,
    methods,
    isLoading: mutation.isPending,
  };
}
