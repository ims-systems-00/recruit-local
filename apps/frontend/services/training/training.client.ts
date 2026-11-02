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
  getTrainings,
  getTrainingById,
  createTraining,
  updateTraining,
  softDeleteTraining,
  hardDeleteTraining,
  restoreTraining,
} from './training.server';
import type {
  TrainingCreateInput,
  TrainingUpdateInput,
  TrainingData,
  TrainingListResponse,
  TrainingListFilters,
} from './training.type';

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

// Query keys
export const trainingKeys = {
  all: ['trainings'] as const,
  lists: () => [...trainingKeys.all, 'list'] as const,
  list: (filters: TrainingListFilters) =>
    [...trainingKeys.lists(), filters] as const,
  details: () => [...trainingKeys.all, 'detail'] as const,
  detail: (id: string) => [...trainingKeys.details(), id] as const,
};

// Hook to fetch list of trainings with cursor-based infinite scroll
export function useInfiniteTrainings(filters: TrainingListFilters = {}) {
  return useInfiniteQuery<
    TrainingListResponse,
    Error,
    InfiniteData<TrainingListResponse, string | undefined>,
    QueryKey,
    string | undefined
  >({
    queryKey: trainingKeys.list(filters),
    queryFn: async ({ pageParam }) => {
      const response = await getTrainings(
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
  });
}

// Hook to fetch a single training by ID
export function useTraining(id: string) {
  const query = useQuery<TrainingData, Error>({
    queryKey: trainingKeys.detail(id),
    queryFn: async () => {
      const response = await getTrainingById(id);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    enabled: !!id,
  });

  return {
    training: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

// Hook to create a new training
export function useCreateTraining() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: TrainingCreateInput) => createTraining(payload),
  });

  const createTrainingAsync = async ({
    payload,
    onSuccessCallback,
  }: {
    payload: TrainingCreateInput;
    onSuccessCallback?: (data: TrainingData) => void;
  }) => {
    try {
      const response = await mutation.mutateAsync(payload);

      if (response.success) {
        toast.success(response.message || 'Training created successfully');
        queryClient.invalidateQueries({ queryKey: trainingKeys.all });
        onSuccessCallback?.(response.data as TrainingData);
      } else {
        toast.error(response.message);
      }
    } catch (error: unknown) {
      toast.error(errorMessage(error, 'Failed to create training'));
    }
  };

  return {
    createTraining: createTrainingAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

// Hook to update an existing training
export function useUpdateTraining() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: TrainingUpdateInput;
    }) => updateTraining(id, payload),
  });

  const updateTrainingAsync = async ({
    id,
    payload,
    onSuccessCallback,
  }: {
    id: string;
    payload: TrainingUpdateInput;
    onSuccessCallback?: (data: TrainingData) => void;
  }) => {
    try {
      const response = await mutation.mutateAsync({ id, payload });

      if (response.success) {
        toast.success(response.message || 'Training updated successfully');
        queryClient.invalidateQueries({ queryKey: trainingKeys.all });
        onSuccessCallback?.(response.data as TrainingData);
      } else {
        toast.error(response.message);
      }
    } catch (error: unknown) {
      toast.error(errorMessage(error, 'Failed to update training'));
    }
  };

  return {
    updateTraining: updateTrainingAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

// Hook to soft delete a training
export function useSoftDeleteTraining() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => softDeleteTraining(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Training removed successfully');
        queryClient.invalidateQueries({ queryKey: trainingKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove training');
    },
  });

  return {
    softDeleteTraining: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

// Hook to hard delete a training
export function useHardDeleteTraining() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => hardDeleteTraining(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Training permanently removed');
        queryClient.invalidateQueries({ queryKey: trainingKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to permanently remove training');
    },
  });

  return {
    hardDeleteTraining: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

// Hook to restore a deleted training
export function useRestoreTraining() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => restoreTraining(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Training restored successfully');
        queryClient.invalidateQueries({ queryKey: trainingKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to restore training');
    },
  });

  return {
    restoreTraining: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
