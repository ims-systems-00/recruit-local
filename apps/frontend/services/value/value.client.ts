import {
  useInfiniteQuery,
  useQuery,
  InfiniteData,
  QueryKey,
} from '@tanstack/react-query';
import { ValueData, ValueListFilters, ValueListResponse } from './value.type';
import { getTopThreeValues, getValues } from './value.server';
import { VALUE_TYPE_ENUM } from '@rl/types';

export const valueKeys = {
  all: ['values'] as const,
  lists: () => [...valueKeys.all, 'list'] as const,
  list: (filters: ValueListFilters) => [...valueKeys.lists(), filters] as const,
  details: () => [...valueKeys.all, 'detail'] as const,
  detail: (id: string) => [...valueKeys.details(), id] as const,
  topThree: (type: VALUE_TYPE_ENUM) =>
    [...valueKeys.all, 'topThree', type] as const,
};

// Hook to fetch list of values
export function useValues(filters: ValueListFilters = {}, isEnabled = true) {
  const query = useQuery<ValueListResponse, Error>({
    queryKey: valueKeys.list(filters),
    queryFn: async () => {
      const response = await getValues(filters);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    enabled: isEnabled,
  });

  return {
    values: query.data?.values || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

// Hook to fetch list of infinite values

export function useInfiniteValues(
  filters: ValueListFilters = {},
  isEnabled = true,
) {
  return useInfiniteQuery<
    ValueListResponse,
    Error,
    InfiniteData<ValueListResponse, string | undefined>,
    QueryKey,
    string | undefined
  >({
    queryKey: valueKeys.list(filters),
    queryFn: async ({ pageParam }) => {
      const response = await getValues(
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

export function useGetTopThreeValues(type: VALUE_TYPE_ENUM) {
  const query = useQuery<ValueData[], Error>({
    queryKey: valueKeys.topThree(type),
    queryFn: async () => {
      const response = await getTopThreeValues(type);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
  });

  return {
    values: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}
