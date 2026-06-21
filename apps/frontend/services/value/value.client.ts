import { useQuery } from '@tanstack/react-query';
import { ValueListFilters, ValueListResponse } from './value.type';
import { getValues } from './value.server';

export const valueKeys = {
  all: ['values'] as const,
  lists: () => [...valueKeys.all, 'list'] as const,
  list: (filters: ValueListFilters) => [...valueKeys.lists(), filters] as const,
  details: () => [...valueKeys.all, 'detail'] as const,
  detail: (id: string) => [...valueKeys.details(), id] as const,
};

// Hook to fetch list of posts
export function useValues(filters: ValueListFilters = {}) {
  const query = useQuery<ValueListResponse, Error>({
    queryKey: valueKeys.list(filters),
    queryFn: async () => {
      const response = await getValues(filters);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
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
