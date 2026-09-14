import {
  useInfiniteQuery,
  useQuery,
  InfiniteData,
  QueryKey,
} from '@tanstack/react-query';
import { IndustryListFilters, IndustryListResponse } from './industry.type';
import { getIndustries } from './industry.server';

export const industryKeys = {
  all: ['industries'] as const,
  lists: () => [...industryKeys.all, 'list'] as const,
  list: (filters: IndustryListFilters) =>
    [...industryKeys.lists(), filters] as const,
  details: () => [...industryKeys.all, 'detail'] as const,
  detail: (id: string) => [...industryKeys.details(), id] as const,
};

// Hook to fetch list of industries
export function useIndustries(
  filters: IndustryListFilters = {},
  isEnabled = true,
) {
  const query = useQuery<IndustryListResponse, Error>({
    queryKey: industryKeys.list(filters),
    queryFn: async () => {
      const response = await getIndustries(filters);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    enabled: isEnabled,
  });

  return {
    industries: query.data?.industries || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

// Hook to fetch list of infinite industries

export function useInfiniteIndustries(
  filters: IndustryListFilters = {},
  isEnabled = true,
) {
  return useInfiniteQuery<
    IndustryListResponse,
    Error,
    InfiniteData<IndustryListResponse, string | undefined>,
    QueryKey,
    string | undefined
  >({
    queryKey: industryKeys.list(filters),
    queryFn: async ({ pageParam }) => {
      const response = await getIndustries(
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
