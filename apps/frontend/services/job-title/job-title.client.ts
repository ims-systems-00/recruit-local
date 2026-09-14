import {
  useInfiniteQuery,
  useQuery,
  InfiniteData,
  QueryKey,
} from '@tanstack/react-query';
import { JobTitleListFilters, JobTitleListResponse } from './job-title.type';
import { getJobTitles } from './job-title.server';

export const jobTitleKeys = {
  all: ['jobTitles'] as const,
  lists: () => [...jobTitleKeys.all, 'list'] as const,
  list: (filters: JobTitleListFilters) =>
    [...jobTitleKeys.lists(), filters] as const,
  details: () => [...jobTitleKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobTitleKeys.details(), id] as const,
};

// Hook to fetch list of industries
export function useJobTitles(
  filters: JobTitleListFilters = {},
  isEnabled = true,
) {
  const query = useQuery<JobTitleListResponse, Error>({
    queryKey: jobTitleKeys.list(filters),
    queryFn: async () => {
      const response = await getJobTitles(filters);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    enabled: isEnabled,
  });

  return {
    jobTitles: query.data?.jobTitles || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

// Hook to fetch list of infinite industries

export function useInfiniteJobTitles(
  filters: JobTitleListFilters = {},
  isEnabled = true,
) {
  return useInfiniteQuery<
    JobTitleListResponse,
    Error,
    InfiniteData<JobTitleListResponse, string | undefined>,
    QueryKey,
    string | undefined
  >({
    queryKey: jobTitleKeys.list(filters),
    queryFn: async ({ pageParam }) => {
      const response = await getJobTitles(
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
