'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getCvs,
  getCvById,
  createCv,
  updateCv,
  softDeleteCv,
  hardDeleteCv,
  restoreCv,
} from './cv.server';
import type {
  CvCreateInput,
  CvUpdateInput,
  Cv,
  CvListResponse,
  CvListFilters,
} from './cv.type';

// --- QUERY KEYS ---
export const cvKeys = {
  all: ['cvs'] as const,
  lists: () => [...cvKeys.all, 'list'] as const,
  list: (filters: CvListFilters) => [...cvKeys.lists(), filters] as const,
  details: () => [...cvKeys.all, 'detail'] as const,
  detail: (id: string) => [...cvKeys.details(), id] as const,
};

export function useCvs(filters: CvListFilters = {}) {
  const query = useQuery<CvListResponse, Error>({
    queryKey: cvKeys.list(filters),
    queryFn: async () => {
      const response = await getCvs(filters);
      if (!response.success) throw new Error(response.message);
      return response.data as CvListResponse;
    },
  });

  return {
    cvs: query.data?.docs || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

export function useCv(id: string) {
  const query = useQuery<Cv, Error>({
    queryKey: cvKeys.detail(id),
    queryFn: async () => {
      const response = await getCvById(id);
      if (!response.success) throw new Error(response.message);
      return response.data as Cv;
    },
    enabled: !!id,
  });

  return {
    cv: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCreateCv() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: CvCreateInput) => createCv(payload),
  });

  const createCvAsync = async ({
    payload,
    onSuccessCallback,
  }: {
    payload: CvCreateInput;
    onSuccessCallback?: (data: Cv) => void;
  }) => {
    try {
      const response = await mutation.mutateAsync(payload);

      if (response.success) {
        toast.success(response.message || 'CV created successfully');
        queryClient.invalidateQueries({ queryKey: cvKeys.all });
        onSuccessCallback?.(response.data as Cv);
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create CV');
    }
  };

  return {
    createCv: createCvAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

export function useUpdateCv() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CvUpdateInput }) =>
      updateCv(id, payload),
  });

  const updateCvAsync = async ({
    id,
    payload,
    onSuccessCallback,
  }: {
    id: string;
    payload: CvUpdateInput;
    onSuccessCallback?: (data: Cv) => void;
  }) => {
    try {
      const response = await mutation.mutateAsync({ id, payload });

      if (response.success) {
        toast.success(response.message || 'CV updated successfully');
        queryClient.invalidateQueries({ queryKey: cvKeys.all });
        onSuccessCallback?.(response.data as Cv);
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update CV');
    }
  };

  return {
    updateCv: updateCvAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

export function useSoftDeleteCv() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => softDeleteCv(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'CV moved to trash');
        queryClient.invalidateQueries({ queryKey: cvKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => toast.error(error.message || 'Failed to delete CV'),
  });

  return { softDeleteCv: mutation.mutateAsync, isLoading: mutation.isPending };
}

export function useRestoreCv() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => restoreCv(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'CV restored successfully');
        queryClient.invalidateQueries({ queryKey: cvKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => toast.error(error.message || 'Failed to restore CV'),
  });

  return { restoreCv: mutation.mutateAsync, isLoading: mutation.isPending };
}
