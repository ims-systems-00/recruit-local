'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getReactions,
  getReactionById,
  createReaction,
  updateReaction,
  softDeleteReaction,
  hardDeleteReaction,
  restoreReaction,
} from './reaction.server';
import type {
  ReactionCreateInput,
  ReactionUpdateInput,
  ReactionData,
  ReactionListResponse,
  ReactionListFilters,
} from './reaction.type';

// Query keys
export const reactionKeys = {
  all: ['reactions'] as const,
  lists: () => [...reactionKeys.all, 'list'] as const,
  list: (filters: ReactionListFilters) =>
    [...reactionKeys.lists(), filters] as const,
  details: () => [...reactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...reactionKeys.details(), id] as const,
};

// Hook to fetch reactions for a given collection entity
export function useReactions(filters: ReactionListFilters) {
  const query = useQuery<ReactionListResponse, Error>({
    queryKey: reactionKeys.list(filters),
    queryFn: async () => {
      const response = await getReactions(filters);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    enabled: !!filters.collectionId,
  });

  return {
    reactions: query.data?.docs || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

// Hook to fetch a single reaction by ID
export function useReaction(id: string) {
  const query = useQuery<ReactionData, Error>({
    queryKey: reactionKeys.detail(id),
    queryFn: async () => {
      const response = await getReactionById(id);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    enabled: !!id,
  });

  return {
    reaction: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

// Hook to create a new reaction
export function useCreateReaction() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: ReactionCreateInput) => createReaction(payload),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Reaction added successfully');
        queryClient.invalidateQueries({ queryKey: reactionKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add reaction');
    },
  });

  return {
    createReaction: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

// Hook to update an existing reaction
export function useUpdateReaction() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ReactionUpdateInput;
    }) => updateReaction(id, payload),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Reaction updated successfully');
        queryClient.invalidateQueries({ queryKey: reactionKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update reaction');
    },
  });

  return {
    updateReaction: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

// Hook to soft delete a reaction
export function useSoftDeleteReaction() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => softDeleteReaction(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Reaction removed successfully');
        queryClient.invalidateQueries({ queryKey: reactionKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove reaction');
    },
  });

  return {
    softDeleteReaction: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

// Hook to hard delete a reaction
export function useHardDeleteReaction() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => hardDeleteReaction(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Reaction permanently removed');
        queryClient.invalidateQueries({ queryKey: reactionKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to permanently remove reaction');
    },
  });

  return {
    hardDeleteReaction: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

// Hook to restore a deleted reaction
export function useRestoreReaction() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => restoreReaction(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Reaction restored successfully');
        queryClient.invalidateQueries({ queryKey: reactionKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to restore reaction');
    },
  });

  return {
    restoreReaction: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
