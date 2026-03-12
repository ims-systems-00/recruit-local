'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getFileMedias,
  getFileMediaById,
  createFileMedia,
  updateFileMedia,
  softDeleteFileMedia,
  hardDeleteFileMedia,
  restoreFileMedia,
} from './file-media.server';
import type {
  FileMediaCreateInput,
  FileMediaUpdateInput,
  FileMedia,
  FileMediaListResponse,
  FileMediaListFilters,
} from './file-media.type';

// --- QUERY KEYS ---
export const fileMediaKeys = {
  all: ['fileMedias'] as const,
  lists: () => [...fileMediaKeys.all, 'list'] as const,
  list: (filters: FileMediaListFilters) =>
    [...fileMediaKeys.lists(), filters] as const,
  details: () => [...fileMediaKeys.all, 'detail'] as const,
  detail: (id: string) => [...fileMediaKeys.details(), id] as const,
};

export function useFileMedias(filters: FileMediaListFilters = {}) {
  const query = useQuery<FileMediaListResponse, Error>({
    queryKey: fileMediaKeys.list(filters),
    queryFn: async () => {
      const response = await getFileMedias(filters);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data as FileMediaListResponse;
    },
  });

  return {
    fileMedias: query.data?.docs || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

export function useFileMedia(id: string) {
  const query = useQuery<FileMedia, Error>({
    queryKey: fileMediaKeys.detail(id),
    queryFn: async () => {
      const response = await getFileMediaById(id);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data as FileMedia;
    },
    enabled: !!id,
  });

  return {
    fileMedia: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCreateFileMedia() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: FileMediaCreateInput) => createFileMedia(payload),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'File media created successfully');
        queryClient.invalidateQueries({ queryKey: fileMediaKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create file media');
    },
  });

  return {
    createFileMedia: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

export function useUpdateFileMedia() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: FileMediaUpdateInput;
    }) => updateFileMedia(id, payload),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'File media updated successfully');
        queryClient.invalidateQueries({ queryKey: fileMediaKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update file media');
    },
  });

  return {
    updateFileMedia: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

export function useSoftDeleteFileMedia() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => softDeleteFileMedia(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'File media removed successfully');
        queryClient.invalidateQueries({ queryKey: fileMediaKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove file media');
    },
  });

  return {
    softDeleteFileMedia: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

export function useHardDeleteFileMedia() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => hardDeleteFileMedia(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'File media permanently removed');
        queryClient.invalidateQueries({ queryKey: fileMediaKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to permanently remove file media');
    },
  });

  return {
    hardDeleteFileMedia: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

export function useRestoreFileMedia() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => restoreFileMedia(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'File media restored successfully');
        queryClient.invalidateQueries({ queryKey: fileMediaKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to restore file media');
    },
  });

  return {
    restoreFileMedia: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
