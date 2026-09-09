'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import {
  InfiniteData,
  QueryKey,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { createJob, getJobs, getPublicJobs, updateJob } from './jobs.server';
import { JobData, JobListFilters, JobListResponse } from './job.type';
import { MultiStepJobFormValues } from '@/app/(authenticated)/(recruiter)/recruiter/job/[uid]/edit/job.schema';

export const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (filters: JobListFilters) => [...jobKeys.lists(), filters] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobKeys.details(), id] as const,
};

export function useJobs(filters: JobListFilters = {}) {
  const query = useQuery<JobListResponse, Error>({
    queryKey: jobKeys.list(filters),
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

export function useCursorJobs(filters: JobListFilters = {}) {
  const [cursorStack, setCursorStack] = useState<(string | undefined)[]>([
    undefined,
  ]);

  const filterKey = JSON.stringify(filters);
  const prevFilterKeyRef = useRef(filterKey);
  if (prevFilterKeyRef.current !== filterKey) {
    prevFilterKeyRef.current = filterKey;
    setCursorStack([undefined]);
  }

  const currentPage = cursorStack.length - 1;
  const currentCursor = cursorStack[currentPage];

  const queryFilters = { ...filters, cursor: currentCursor };

  const query = useQuery<JobListResponse, Error>({
    queryKey: jobKeys.list(queryFilters),
    queryFn: async () => {
      const response = await getJobs(queryFilters);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
  });

  const goToNextPage = useCallback(() => {
    const nextCursor = query.data?.pagination?.nextCursor;
    if (nextCursor && query.data?.pagination?.hasNextPage) {
      setCursorStack((prev) => [...prev, nextCursor]);
    }
  }, [query.data]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 0) {
      setCursorStack((prev) => prev.slice(0, -1));
    }
  }, [currentPage]);

  const resetToFirstPage = useCallback(() => {
    setCursorStack([undefined]);
  }, []);

  return {
    jobs: query.data?.docs || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isFetching: query.isFetching,
    currentPage,
    hasNextPage: query.data?.pagination?.hasNextPage ?? false,
    hasPrevPage: currentPage > 0,
    goToNextPage,
    goToPreviousPage,
    resetToFirstPage,
  };
}

export function useInfiniteJobs(
  filters: JobListFilters = {},
  isEnabled = true,
) {
  return useInfiniteQuery<
    JobListResponse,
    Error,
    InfiniteData<JobListResponse, string | undefined>,
    QueryKey,
    string | undefined
  >({
    queryKey: jobKeys.list(filters),
    queryFn: async ({ pageParam }) => {
      const response = await getJobs(
        pageParam ? { ...filters, cursor: pageParam } : filters,
      );

      if (!response.success) {
        throw new Error(response.message);
      }

      return response.data;
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination?.hasNextPage
        ? lastPage.pagination.nextCursor
        : undefined;
    },
    enabled: isEnabled,
  });
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

//for public user

export function usePublicJobs(filters: JobListFilters = {}) {
  const query = useQuery<JobListResponse, Error>({
    queryKey: ['public-jobs', filters],
    queryFn: async () => {
      const response = await getPublicJobs(filters);
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

export function useInfinitePublicJobs(
  filters: JobListFilters = {},
  isEnabled = true,
) {
  return useInfiniteQuery<
    JobListResponse,
    Error,
    InfiniteData<JobListResponse, string | undefined>,
    QueryKey,
    string | undefined
  >({
    queryKey: ['public-jobs', filters],
    queryFn: async ({ pageParam }) => {
      const response = await getPublicJobs(
        pageParam ? { ...filters, cursor: pageParam } : filters,
      );

      if (!response.success) {
        throw new Error(response.message);
      }

      return response.data;
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination?.hasNextPage
        ? lastPage.pagination.nextCursor
        : undefined;
    },
    enabled: isEnabled,
  });
}
