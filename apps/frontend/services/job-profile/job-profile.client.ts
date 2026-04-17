'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getJobProfiles,
  getJobProfileById,
  createJobProfile,
  updateJobProfile,
  softDeleteJobProfile,
  hardDeleteJobProfile,
  restoreJobProfile,
} from './job-profile.server';
import type {
  JobProfileCreateInput,
  JobProfileUpdateInput,
  JobProfile,
  JobProfileListResponse,
  JobProfileListFilters,
} from './job-profile.type';
import { useRouter } from 'next/navigation';

// --- QUERY KEYS ---
export const jobProfileKeys = {
  all: ['jobProfiles'] as const,
  lists: () => [...jobProfileKeys.all, 'list'] as const,
  list: (filters: JobProfileListFilters) =>
    [...jobProfileKeys.lists(), filters] as const,
  details: () => [...jobProfileKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobProfileKeys.details(), id] as const,
};

export function useJobProfiles(filters: JobProfileListFilters = {}) {
  const query = useQuery<JobProfileListResponse, Error>({
    queryKey: jobProfileKeys.list(filters),
    queryFn: async () => {
      const response = await getJobProfiles(filters);
      if (!response.success) throw new Error(response.message);
      return response.data as JobProfileListResponse;
    },
  });

  return {
    jobProfiles: query.data?.docs || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

export function useJobProfile(id: string) {
  const query = useQuery<JobProfile, Error>({
    queryKey: jobProfileKeys.detail(id),
    queryFn: async () => {
      const response = await getJobProfileById(id);
      if (!response.success) throw new Error(response.message);
      return response.data as JobProfile;
    },
    enabled: !!id,
  });

  return {
    jobProfile: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCreateJobProfile() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: (payload: JobProfileCreateInput) => createJobProfile(payload),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Job profile created successfully');
        queryClient.invalidateQueries({ queryKey: jobProfileKeys.all });
        router.push(`/candidate/profile/${response.data?._id}`);
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) =>
      toast.error(error.message || 'Failed to create job profile'),
  });

  return {
    createJobProfile: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}

export function useUpdateJobProfile() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: JobProfileUpdateInput;
    }) => updateJobProfile(id, payload),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Job profile updated successfully');
        queryClient.invalidateQueries({ queryKey: jobProfileKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) =>
      toast.error(error.message || 'Failed to update job profile'),
  });

  return {
    updateJobProfile: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}

export function useSoftDeleteJobProfile() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => softDeleteJobProfile(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Job profile moved to trash');
        queryClient.invalidateQueries({ queryKey: jobProfileKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) =>
      toast.error(error.message || 'Failed to delete job profile'),
  });

  return {
    softDeleteJobProfile: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}

export function useHardDeleteJobProfile() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => hardDeleteJobProfile(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Job profile permanently deleted');
        queryClient.invalidateQueries({ queryKey: jobProfileKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) =>
      toast.error(error.message || 'Failed to permanently delete job profile'),
  });

  return {
    hardDeleteJobProfile: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}

export function useRestoreJobProfile() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => restoreJobProfile(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Job profile restored successfully');
        queryClient.invalidateQueries({ queryKey: jobProfileKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) =>
      toast.error(error.message || 'Failed to restore job profile'),
  });

  return {
    restoreJobProfile: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}
