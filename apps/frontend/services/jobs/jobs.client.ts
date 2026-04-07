'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FieldPath, Resolver, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createJob, getJobs, updateJob } from './jobs.server';
import { JobListFilters, JobListResponse } from './job.type';
import {
  fullJobSchema,
  MultiStepJobFormValues,
  stepOneJobSchema,
  stepThreeJobSchema,
  stepTwoJobSchema,
} from '@/app/(authenticated)/(recruiter)/recruiter/job/[uid]/edit/job.schema';

export const stepFields: Record<number, FieldPath<MultiStepJobFormValues>[]> = {
  1: [
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
    'email',
    'endDate',
    'number',
    'aboutUs',
    'autoFill',
  ],

  2: [
    'requiredDocuments',

    'description',
    'responsibility',
    'attachmentsStorage',
  ],

  3: ['category', 'keywords'],
};

export function useJobs(filters: JobListFilters = {}) {
  const query = useQuery<JobListResponse, Error>({
    queryKey: ['jobs', filters],
    queryFn: async () => {
      const response = await getJobs(filters);
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

const getStepSchema = (step: number): any => {
  switch (step) {
    case 1:
      return stepOneJobSchema;
    case 2:
      return stepTwoJobSchema;
    case 3:
      return stepThreeJobSchema;
    default:
      return fullJobSchema;
  }
};

export function useUpdateJob({
  id,
  defaultValues,
}: {
  id: string;
  defaultValues?: Partial<MultiStepJobFormValues>;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const methods = useForm<Partial<MultiStepJobFormValues>>({
    resolver: yupResolver(getStepSchema(step)) as Resolver<
      Partial<MultiStepJobFormValues>
    >,
    defaultValues,
    mode: 'onChange',
    shouldUnregister: false,
  });

  const mutation = useMutation({
    mutationFn: updateJob,
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message || 'Saved successfully');
      setStep((prev) => prev + 1);
    },
    onError: () => {
      toast.error('Something went wrong');
    },
  });

  function cleanPayload(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(cleanPayload).filter((item) => item !== undefined);
    }

    if (obj !== null && typeof obj === 'object') {
      const cleaned: any = {};

      Object.keys(obj).forEach((key) => {
        const value = cleanPayload(obj[key]);

        const isEmptyObject =
          typeof value === 'object' &&
          value !== null &&
          !Array.isArray(value) &&
          Object.keys(value).length === 0;

        if (
          value !== undefined &&
          value !== null &&
          value !== '' &&
          !(Array.isArray(value) && value.length === 0) &&
          !isEmptyObject
        ) {
          cleaned[key] = value;
        }
      });

      return cleaned;
    }

    return obj;
  }

  const nextStep = async () => {
    const fields = stepFields[step as keyof typeof stepFields];

    const isValid = await methods.trigger(fields as any);
    if (!isValid) return;

    const values = methods.getValues();
    const cleanedValues = {
      ...cleanPayload(values),
      salary: {
        ...values.salary,
        amount: Number(values.salary?.amount),
      },
    };

    console.log('cleanedValues', cleanedValues);

    mutation.mutate({
      id,
      data: cleanedValues,
    });
  };

  const prevStep = () => setStep((prev) => prev - 1);

  const onSubmit = methods.handleSubmit((data) => {
    const cleanedValues = {
      ...cleanPayload(data),
      salary: {
        ...data.salary,
        amount: Number(data.salary?.amount),
      },
    };
    mutation.mutate({
      id,
      data: cleanedValues,
    });
  });

  return {
    step,
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
      router.push(`/recruiter/job/${res.data._id}/edit`);
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
