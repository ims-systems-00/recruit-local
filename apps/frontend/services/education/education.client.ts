'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getEducations,
  getEducationById,
  createEducation,
  updateEducation,
  softDeleteEducation,
  hardDeleteEducation,
  restoreEducation,
} from './education.server';
import type {
  EducationCreateInput,
  EducationUpdateInput,
  EducationData,
  EducationListResponse,
} from './education.type';

// Query keys
export const educationKeys = {
  all: ['educations'] as const,
  lists: () => [...educationKeys.all, 'list'] as const,
  list: (filters: { page?: number; limit?: number; search?: string }) =>
    [...educationKeys.lists(), filters] as const,
  details: () => [...educationKeys.all, 'detail'] as const,
  detail: (id: string) => [...educationKeys.details(), id] as const,
};

// Hook to fetch list of educations
export function useEducations(filters?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const query = useQuery<EducationListResponse, Error>({
    queryKey: educationKeys.list(filters || {}),
    queryFn: async () => {
      const response = await getEducations(filters);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
  });

  return {
    educations: query.data?.docs || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

// Hook to fetch a single education by ID
export function useEducation(id: string) {
  const query = useQuery<EducationData, Error>({
    queryKey: educationKeys.detail(id),
    queryFn: async () => {
      const response = await getEducationById(id);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    enabled: !!id,
  });

  return {
    education: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

// Hook to create a new education
export function useCreateEducation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: EducationCreateInput) => createEducation(payload),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Education created successfully');
        queryClient.invalidateQueries({ queryKey: educationKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create education');
    },
  });

  return {
    createEducation: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

// Hook to update an existing education
export function useUpdateEducation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: EducationUpdateInput;
    }) => updateEducation(id, payload),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Education updated successfully');
        queryClient.invalidateQueries({ queryKey: educationKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update education');
    },
  });

  return {
    updateEducation: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

// Hook to soft delete an education
export function useSoftDeleteEducation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => softDeleteEducation(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Education removed successfully');
        queryClient.invalidateQueries({ queryKey: educationKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove education');
    },
  });

  return {
    softDeleteEducation: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

// Hook to hard delete an education
export function useHardDeleteEducation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => hardDeleteEducation(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Education permanently removed');
        queryClient.invalidateQueries({ queryKey: educationKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to permanently remove education');
    },
  });

  return {
    hardDeleteEducation: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

// Hook to restore a deleted education
export function useRestoreEducation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => restoreEducation(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Education restored successfully');
        queryClient.invalidateQueries({ queryKey: educationKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to restore education');
    },
  });

  return {
    restoreEducation: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
