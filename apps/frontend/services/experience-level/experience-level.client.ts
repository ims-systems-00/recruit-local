import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  ExperienceLevelListFilters,
  ExperienceLevelListResponse,
} from './experience-level.type';
import { getExperienceLevels } from './experience-level.server';

export const experienceLevelKeys = {
  all: ['experience-levels'] as const,
  lists: () => [...experienceLevelKeys.all, 'list'] as const,
  list: (filters: ExperienceLevelListFilters) =>
    [...experienceLevelKeys.lists(), filters] as const,
  details: () => [...experienceLevelKeys.all, 'detail'] as const,
  detail: (id: string) => [...experienceLevelKeys.details(), id] as const,
};

// Hook to fetch list of experience levels
export function useExperienceLevels(
  filters: ExperienceLevelListFilters = {},
  isEnabled = true,
) {
  const query = useQuery<ExperienceLevelListResponse, Error>({
    queryKey: experienceLevelKeys.list(filters),
    queryFn: async () => {
      const response = await getExperienceLevels(filters);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    enabled: isEnabled,
  });

  return {
    experienceLevels: query.data?.experienceLevels || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

// Hook to fetch list of infinite experience levels

export function useInfiniteExperienceLevels(
  filters: ExperienceLevelListFilters = {},
  isEnabled = true,
) {
  return useInfiniteQuery({
    queryKey: experienceLevelKeys.list(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await getExperienceLevels({
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
