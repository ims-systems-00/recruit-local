import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { WorkModeListFilters, WorkModeListResponse } from './work-mode.type';
import { getWorkModes } from './work-mode.server';

export const workModeKeys = {
  all: ['work-modes'] as const,
  lists: () => [...workModeKeys.all, 'list'] as const,
  list: (filters: WorkModeListFilters) =>
    [...workModeKeys.lists(), filters] as const,
  details: () => [...workModeKeys.all, 'detail'] as const,
  detail: (id: string) => [...workModeKeys.details(), id] as const,
};

// Hook to fetch list of work modes
export function useWorkModes(
  filters: WorkModeListFilters = {},
  isEnabled = true,
) {
  const query = useQuery<WorkModeListResponse, Error>({
    queryKey: workModeKeys.list(filters),
    queryFn: async () => {
      const response = await getWorkModes(filters);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    enabled: isEnabled,
  });

  return {
    workModes: query.data?.workModes || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

// Hook to fetch list of infinite work modes

export function useInfiniteWorkModes(
  filters: WorkModeListFilters = {},
  isEnabled = true,
) {
  return useInfiniteQuery({
    queryKey: workModeKeys.list(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await getWorkModes({
        ...filters,
        page: pageParam,
      });

      if (!response.success) {
        throw new Error(response.message);
      }

      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination?.hasNextPage
        ? lastPage.pagination.page + 1
        : undefined;
    },
    enabled: isEnabled,
  });
}
