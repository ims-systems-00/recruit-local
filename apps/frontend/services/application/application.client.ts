'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  softDeleteApplication,
  hardDeleteApplication,
  restoreApplication,
  moveApplicationToColumn,
} from './application.server';
import type {
  ApplicationCreateInput,
  ApplicationUpdateInput,
  Application,
  ApplicationListResponse,
  ApplicationListFilters,
  MoveApplicationToColumnInput,
} from './application.type';
import { useRouter } from 'next/navigation';

// --- QUERY KEYS ---
export const applicationKeys = {
  all: ['applications'] as const,
  lists: () => [...applicationKeys.all, 'list'] as const,
  list: (filters: ApplicationListFilters) =>
    [...applicationKeys.lists(), filters] as const,
  details: () => [...applicationKeys.all, 'detail'] as const,
  detail: (id: string) => [...applicationKeys.details(), id] as const,
};

export function useApplications(filters: ApplicationListFilters = {}) {
  const query = useQuery<ApplicationListResponse, Error>({
    queryKey: applicationKeys.list(filters),
    queryFn: async () => {
      const response = await getApplications(filters);
      if (!response.success) throw new Error(response.message);
      return response.data as ApplicationListResponse;
    },
  });

  return {
    applications: query.data?.docs || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

export function useApplication(id: string) {
  const query = useQuery<Application, Error>({
    queryKey: applicationKeys.detail(id),
    queryFn: async () => {
      const response = await getApplicationById(id);
      if (!response.success) throw new Error(response.message);
      return response.data as Application;
    },
    enabled: !!id,
  });

  return {
    application: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: (payload: ApplicationCreateInput) => createApplication(payload),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Application created successfully');
        queryClient.invalidateQueries({ queryKey: applicationKeys.all });
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
        router.push(`/candidate/jobs`);
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) =>
      toast.error(error.message || 'Failed to create application'),
  });

  return {
    createApplication: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}

export function useUpdateApplication() {
  const mutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ApplicationUpdateInput;
    }) => updateApplication(id, payload),
  });

  const updateApplicationAsync = async ({
    id,
    payload,
    onSuccessCallback,
  }: {
    id: string;
    payload: ApplicationUpdateInput;
    onSuccessCallback?: (data: Application) => void;
  }) => {
    try {
      const response = await mutation.mutateAsync({ id, payload });

      if (response.success) {
        toast.success(response.message || 'Application updated successfully');
        onSuccessCallback?.(response.data as Application);
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update Application');
    }
  };

  return {
    updateApplication: updateApplicationAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

export function useMoveApplicationToColumn() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: MoveApplicationToColumnInput;
    }) => moveApplicationToColumn(id, payload),
  });

  const moveApplicationToColumnAsync = async ({
    id,
    payload,
    onSuccessCallback,
    onErrorCallback,
  }: {
    id: string;
    payload: MoveApplicationToColumnInput;
    onSuccessCallback?: (data: Application) => void;
    onErrorCallback?: () => void;
  }) => {
    try {
      const response = await mutation.mutateAsync({ id, payload });

      if (response.success) {
        toast.success(
          response.message || 'Application moved to column successfully',
        );
        queryClient.invalidateQueries({ queryKey: applicationKeys.all });
        // queryClient.invalidateQueries({ queryKey: ['statuses'] });
        onSuccessCallback?.(response.data as Application);
      } else {
        toast.error(response.message);
        onErrorCallback?.();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to move application to column');
      onErrorCallback?.();
    }
  };

  return {
    moveApplicationToColumn: moveApplicationToColumnAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

export function useSoftDeleteApplication() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => softDeleteApplication(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Application moved to trash');
        queryClient.invalidateQueries({ queryKey: applicationKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) =>
      toast.error(error.message || 'Failed to delete application'),
  });

  return {
    softDeleteApplication: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}

export function useHardDeleteApplication() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => hardDeleteApplication(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Application permanently deleted');
        queryClient.invalidateQueries({ queryKey: applicationKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) =>
      toast.error(error.message || 'Failed to permanently delete application'),
  });

  return {
    hardDeleteApplication: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}

export function useRestoreApplication() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => restoreApplication(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Application restored successfully');
        queryClient.invalidateQueries({ queryKey: applicationKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) =>
      toast.error(error.message || 'Failed to restore application'),
  });

  return {
    restoreApplication: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}
