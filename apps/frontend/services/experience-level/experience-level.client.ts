import {
  useInfiniteQuery,
  useQuery,
  InfiniteData,
  QueryKey,
} from '@tanstack/react-query';
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
  return useInfiniteQuery<
    ExperienceLevelListResponse,
    Error,
    InfiniteData<ExperienceLevelListResponse, string | undefined>,
    QueryKey,
    string | undefined
  >({
    queryKey: experienceLevelKeys.list(filters),
    queryFn: async ({ pageParam }) => {
      const response = await getExperienceLevels(
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
