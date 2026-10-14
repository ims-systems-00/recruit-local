'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  InfiniteData,
  QueryKey,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getJobProfiles,
  getJobProfileById,
  createJobProfile,
  updateJobProfile,
  softDeleteJobProfile,
  hardDeleteJobProfile,
  restoreJobProfile,
  getAppliedJobs,
  evaluateValue,
} from './job-profile.server';
import type {
  JobProfileCreateInput,
  JobProfileUpdateInput,
  JobProfile,
  JobProfileListResponse,
  JobProfileListFilters,
  JobProfileData,
  AppliedJobsListFilters,
  EvaluateValueInput,
} from './job-profile.type';
import { useRouter } from 'next/navigation';
import { JobData } from '../jobs/job.type';
import { CursorPaginatedResponse } from '@/types/api';
import { useSession } from 'next-auth/react';
import { ONBOARDING_STEP_ENUMS, ValueScoreResponseDto } from '@rl/types';

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

export function useJobProfile(id: string, isEnabled?: boolean) {
  const query = useQuery<JobProfileData, Error>({
    queryKey: jobProfileKeys.detail(id),
    queryFn: async () => {
      const response = await getJobProfileById(id);
      if (!response.success) throw new Error(response.message);
      return response.data as JobProfileData;
    },
    enabled: !!id && isEnabled,
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
  const { data: session, update } = useSession();

  const mutation = useMutation({
    mutationFn: (payload: JobProfileCreateInput) => createJobProfile(payload),
    onSuccess: async (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: jobProfileKeys.all });
        queryClient.invalidateQueries({
          queryKey: ['user', session?.user?._id],
        });

        await update({
          user: {
            ...session?.user,
            jobProfileId: response.data?._id,
          },
        });

        router.push(
          `/candidate/onboarding/personalisation?step=${ONBOARDING_STEP_ENUMS.CV_UPLOAD}`,
        );
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
  const mutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: JobProfileUpdateInput;
    }) => updateJobProfile(id, payload),
  });

  const updateJobProfileAsync = async ({
    id,
    payload,
    onSuccessCallback,
  }: {
    id: string;
    payload: JobProfileUpdateInput;
    onSuccessCallback?: (data: JobProfileData) => void;
  }) => {
    try {
      const response = await mutation.mutateAsync({ id, payload });

      if (response.success) {
        toast.success(response.message || 'Job profile updated successfully');
        onSuccessCallback?.(response.data as JobProfileData);
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update Job Profile');
    }
  };

  return {
    updateJobProfile: updateJobProfileAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Evaluates one value and writes the new score into the cached profile.
 *
 * Patches the cache instead of invalidating it on purpose: a refetch hands the
 * onboarding values round a new `values` array, which resets the round's
 * unsaved selection. Only `valueScores` is replaced, so `values` keeps its
 * reference and the selection survives.
 */
export function useEvaluateValue() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: EvaluateValueInput;
    }) => evaluateValue(id, payload),
  });

  const evaluateValueAsync = async ({
    id,
    payload,
    onSuccessCallback,
  }: {
    id: string;
    payload: EvaluateValueInput;
    onSuccessCallback?: (data: ValueScoreResponseDto) => void;
  }) => {
    try {
      const response = await mutation.mutateAsync({ id, payload });

      if (!response.success) {
        toast.error(response.message);
        return;
      }

      const valueScore = response.data;
      queryClient.setQueryData<JobProfileData>(
        jobProfileKeys.detail(id),
        (old) =>
          old && {
            ...old,
            valueScores: [
              ...(old.valueScores ?? []).filter(
                (item) => item.value !== valueScore.value,
              ),
              valueScore,
            ],
          },
      );

      toast.success(`Your score: ${valueScore.score}%`, {
        description: valueScore.feedback,
      });
      onSuccessCallback?.(valueScore);
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : 'Failed to evaluate your answers',
      );
    }
  };

  return {
    evaluateValue: evaluateValueAsync,
    isPending: mutation.isPending,
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

export function useInfiniteAppliedJobs(filters: AppliedJobsListFilters = {}) {
  const { data: session } = useSession();

  return useInfiniteQuery<
    CursorPaginatedResponse<JobData>,
    Error,
    InfiniteData<CursorPaginatedResponse<JobData>, string | undefined>,
    QueryKey,
    string | undefined
  >({
    queryKey: ['applied-jobs', session?.user?.jobProfileId, filters],
    queryFn: async ({ pageParam }) => {
      const response = await getAppliedJobs(
        session?.user?.jobProfileId || '',
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
    enabled: !!session?.user?.jobProfileId,
  });
}
