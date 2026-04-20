'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createJob, getJobs, updateJob } from './jobs.server';
import { JobData, JobListFilters, JobListResponse } from './job.type';
import { MultiStepJobFormValues } from '@/app/(authenticated)/(recruiter)/recruiter/job/[uid]/edit/job.schema';

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

export function useUpdateJob() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<MultiStepJobFormValues>;
    }) => updateJob({ id, data }),
  });

  const updateJobAsync = async ({
    id,
    data,
    onSuccessNext,
    onError,
  }: {
    id: string;
    data: Partial<MultiStepJobFormValues>;
    onSuccessNext?: (data: Partial<JobData>) => void;
    onError?: () => void;
  }) => {
    try {
      const response = await mutation.mutateAsync({ id, data });

      if (response.success) {
        toast.success(response.message || 'Job updated successfully');
        onSuccessNext?.(response.data as Partial<JobData>);
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
      } else {
        toast.error(response.message);
        onError?.();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update job');
    }
  };

  return {
    updateJob: updateJobAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

export function useCreateJob() {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: createJob,
    onSuccess: (res, variables) => {
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
