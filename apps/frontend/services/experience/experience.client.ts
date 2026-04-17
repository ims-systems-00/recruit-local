'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getExperiences,
  getExperienceById,
  createExperience,
  updateExperience,
  softDeleteExperience,
  hardDeleteExperience,
  restoreExperience,
} from './experience.server';
import type {
  ExperienceCreateInput,
  ExperienceUpdateInput,
  ExperienceData,
  ExperienceListResponse,
  ExperienceListFilters,
} from './experience.type';
import { JobProfile } from '../job-profile/job-profile.type';

// Query keys
export const experienceKeys = {
  all: ['experiences'] as const,
  lists: () => [...experienceKeys.all, 'list'] as const,
  list: (filters: ExperienceListFilters) =>
    [...experienceKeys.lists(), filters] as const,
  details: () => [...experienceKeys.all, 'detail'] as const,
  detail: (id: string) => [...experienceKeys.details(), id] as const,
};

// Hook to fetch list of experiences
export function useExperiences(filters: ExperienceListFilters = {}) {
  const query = useQuery<ExperienceListResponse, Error>({
    queryKey: experienceKeys.list(filters),
    queryFn: async () => {
      const response = await getExperiences(filters);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
  });

  return {
    experiences: query.data?.docs || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

// Hook to fetch a single experience by ID
export function useExperience(id: string) {
  const query = useQuery<ExperienceData, Error>({
    queryKey: experienceKeys.detail(id),
    queryFn: async () => {
      const response = await getExperienceById(id);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    enabled: !!id,
  });

  return {
    experience: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

// Hook to create a new experience

export function useCreateExperience() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: ExperienceCreateInput) => createExperience(payload),
  });

  const createExperienceAsync = async ({
    payload,
    onSuccessCallback,
  }: {
    payload: ExperienceCreateInput;
    onSuccessCallback?: (data: ExperienceData) => void;
  }) => {
    try {
      const response = await mutation.mutateAsync(payload);

      if (response.success) {
        toast.success(response.message || 'Experience created successfully');
        queryClient.invalidateQueries({ queryKey: experienceKeys.all });
        onSuccessCallback?.(response.data as ExperienceData);
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create experience');
    }
  };

  return {
    createExperience: createExperienceAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

export function useUpdateExperience() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ExperienceUpdateInput;
    }) => updateExperience(id, payload),
  });

  const updateExperienceAsync = async ({
    id,
    payload,
    onSuccessCallback,
  }: {
    id: string;
    payload: ExperienceUpdateInput;
    onSuccessCallback?: (data: ExperienceData) => void;
  }) => {
    try {
      const response = await mutation.mutateAsync({ id, payload });

      if (response.success) {
        toast.success(response.message || 'Experience updated successfully');
        queryClient.invalidateQueries({ queryKey: experienceKeys.all });
        onSuccessCallback?.(response.data as ExperienceData);
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update Experience');
    }
  };

  return {
    updateExperience: updateExperienceAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

// Hook to soft delete an experience
export function useSoftDeleteExperience() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => softDeleteExperience(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Experience removed successfully');
        queryClient.invalidateQueries({ queryKey: experienceKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove experience');
    },
  });

  return {
    softDeleteExperience: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

// Hook to hard delete an experience
export function useHardDeleteExperience() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => hardDeleteExperience(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Experience permanently removed');
        queryClient.invalidateQueries({ queryKey: experienceKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to permanently remove experience');
    },
  });

  return {
    hardDeleteExperience: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

// Hook to restore a deleted experience
export function useRestoreExperience() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => restoreExperience(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Experience restored successfully');
        queryClient.invalidateQueries({ queryKey: experienceKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to restore experience');
    },
  });

  return {
    restoreExperience: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
