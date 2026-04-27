'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getStatuses,
  getStatusById,
  createStatus,
  updateStatus,
  softDeleteStatus,
  hardDeleteStatus,
  restoreStatus,
} from './status.server';
import type {
  StatusCreateInput,
  StatusUpdateInput,
  StatusData,
  StatusListResponse,
  StatusListFilters,
} from './status.type';

// Query keys
export const statusKeys = {
  all: ['statuses'] as const,
  lists: () => [...statusKeys.all, 'list'] as const,
  list: (filters: StatusListFilters) =>
    [...statusKeys.lists(), filters] as const,
  details: () => [...statusKeys.all, 'detail'] as const,
  detail: (id: string) => [...statusKeys.details(), id] as const,
};

// Hook to fetch list of statuses
export function useStatuses(filters: StatusListFilters = {}) {
  const query = useQuery<StatusListResponse, Error>({
    queryKey: statusKeys.list(filters),
    queryFn: async () => {
      const response = await getStatuses(filters);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
  });

  return {
    statuses: query.data?.docs || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

// Hook to fetch a single status by ID
export function useStatus(id: string) {
  const query = useQuery<StatusData, Error>({
    queryKey: statusKeys.detail(id),
    queryFn: async () => {
      const response = await getStatusById(id);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    enabled: !!id,
  });

  return {
    status: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCreateStatus() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: StatusCreateInput) => createStatus(payload),
  });

  const createStatusAsync = async ({
    payload,
    onSuccessCallback,
    onError,
  }: {
    payload: StatusCreateInput;
    onSuccessCallback?: (data: Partial<StatusData>) => void;
    onError?: () => void;
  }) => {
    try {
      const response = await mutation.mutateAsync(payload);

      if (response.success) {
        toast.success(response.message || 'Status created successfully');
        onSuccessCallback?.(response.data as Partial<StatusData>);
        queryClient.invalidateQueries({ queryKey: statusKeys.all });
      } else {
        toast.error(response.message);
        onError?.();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create status');
    }
  };

  return {
    createStatus: createStatusAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

// Hook to update an existing status
export function useUpdateStatus() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: StatusUpdateInput }) =>
      updateStatus(id, payload),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Status updated successfully');
        queryClient.invalidateQueries({ queryKey: statusKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update status');
    },
  });

  return {
    updateStatus: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

// Hook to soft delete a status
export function useSoftDeleteStatus() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => softDeleteStatus(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Status removed successfully');
        queryClient.invalidateQueries({ queryKey: statusKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove status');
    },
  });

  return {
    softDeleteStatus: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

// Hook to hard delete a status
export function useHardDeleteStatus() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => hardDeleteStatus(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Status permanently removed');
        queryClient.invalidateQueries({ queryKey: statusKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to permanently remove status');
    },
  });

  return {
    hardDeleteStatus: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

// Hook to restore a deleted status
export function useRestoreStatus() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => restoreStatus(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Status restored successfully');
        queryClient.invalidateQueries({ queryKey: statusKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to restore status');
    },
  });

  return {
    restoreStatus: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
