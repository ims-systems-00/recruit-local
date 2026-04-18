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
  EducationListFilters,
} from './education.type';

// Query keys
export const educationKeys = {
  all: ['educations'] as const,
  lists: () => [...educationKeys.all, 'list'] as const,
  list: (filters: EducationListFilters) =>
    [...educationKeys.lists(), filters] as const,
  details: () => [...educationKeys.all, 'detail'] as const,
  detail: (id: string) => [...educationKeys.details(), id] as const,
};

// Hook to fetch list of educations
export function useEducations(filters: EducationListFilters = {}) {
  const query = useQuery<EducationListResponse, Error>({
    queryKey: educationKeys.list(filters),
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
  });

  const createEducationAsync = async ({
    payload,
    onSuccessCallback,
  }: {
    payload: EducationCreateInput;
    onSuccessCallback?: (data: EducationData) => void;
  }) => {
    try {
      const response = await mutation.mutateAsync(payload);

      if (response.success) {
        toast.success(response.message || 'Education created successfully');
        queryClient.invalidateQueries({ queryKey: educationKeys.all });
        onSuccessCallback?.(response.data as EducationData);
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create education');
    }
  };

  return {
    createEducation: createEducationAsync,
    isPending: mutation.isPending,
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
  });

  const updateEducationAsync = async ({
    id,
    payload,
    onSuccessCallback,
  }: {
    id: string;
    payload: EducationUpdateInput;
    onSuccessCallback?: (data: EducationData) => void;
  }) => {
    try {
      const response = await mutation.mutateAsync({ id, payload });

      if (response.success) {
        toast.success(response.message || 'Education updated successfully');
        queryClient.invalidateQueries({ queryKey: educationKeys.all });
        onSuccessCallback?.(response.data as EducationData);
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update Education');
    }
  };

  return {
    updateEducation: updateEducationAsync,
    isPending: mutation.isPending,
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
        toast.success(response.message || 'Education removed successfully');
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
        toast.success(response.message || 'Education permanently removed');
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
        toast.success(response.message || 'Education restored successfully');
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
