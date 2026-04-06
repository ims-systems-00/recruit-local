'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FieldPath, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fullJobSchema,
  MultiStepJobFormValues,
} from '@/app/(authenticated)/(recruiter)/recruiter/job/create/job.schema';
import { createJob, getJobs } from './jobs.server';
import { JobListFilters, JobListResponse } from './job.type';

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

export function useJobs(filters: JobListFilters = {}) {
  const query = useQuery<JobListResponse, Error>({
    queryKey: ['jobs', filters],
    queryFn: async () => {
      const response = await getJobs();
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
  });

  return {
    jobs: query.data?.docs || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

export function useUpdateJob() {
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
    onSuccess: (res, variables) => {
      console.log('res', res, variables);
      if (!res.success) {
        toast.error(res.message);
        return;
      }

      toast.success('Registration completed');
      // router.push('/recruiter/job/lists');
    },
    onError: () => {
      toast.error('Something went wrong');
    },
  });

  const nextStep = async () => {
    const fields = stepFields[step as keyof typeof stepFields];

    const isValid = await trigger(fields);

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

export function useCreateJob() {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: createJob,
    onSuccess: (res, variables) => {
      console.log('res', res, variables);
      if (!res.success) {
        toast.error(res.message);
        return;
      }

      toast.success(res.message || 'Registration completed');
      // router.push('/recruiter/job/lists');
    },
    onError: () => {
      toast.error('Something went wrong');
    },
  });

  const onSubmit = (data: { title: 'Untitled Title' }) => {
    mutation.mutate(data);
  };

  return {
    onSubmit,
    isLoading: mutation.isPending,
  };
}
