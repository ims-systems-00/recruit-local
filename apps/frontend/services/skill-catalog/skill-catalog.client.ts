import { useQuery } from '@tanstack/react-query';
import {
  SkillCatalogListFilters,
  SkillCatalogListResponse,
} from './skill-catalog.type';
import { getSkillCatalog } from './skill-catalog.server';

export const skillCatalogKeys = {
  all: ['skillCatalog'] as const,
  lists: () => [...skillCatalogKeys.all, 'list'] as const,
  list: (filters: SkillCatalogListFilters) =>
    [...skillCatalogKeys.lists(), filters] as const,
};

// Hook to search the skill catalogue, e.g. as a recruiter types a skill.
export function useSkillCatalog(
  filters: SkillCatalogListFilters = {},
  isEnabled = true,
) {
  const query = useQuery<SkillCatalogListResponse, Error>({
    queryKey: skillCatalogKeys.list(filters),
    queryFn: async () => {
      const response = await getSkillCatalog(filters);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    enabled: isEnabled,
  });

  return {
    skills: query.data?.skills || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}
