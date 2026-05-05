'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getFavourites,
  getFavouriteById,
  createFavourite,
  updateFavourite,
  softDeleteFavourite,
  hardDeleteFavourite,
  restoreFavourite,
} from './favourite.server';
import type {
  FavouriteCreateInput,
  FavouriteUpdateInput,
  FavouriteData,
  FavouriteListResponse,
  FavouriteListFilters,
} from './favourite.type';

// Query keys
export const favouriteKeys = {
  all: ['favourites'] as const,
  lists: () => [...favouriteKeys.all, 'list'] as const,
  list: (filters?: FavouriteListFilters) =>
    [...favouriteKeys.lists(), filters] as const,
  details: () => [...favouriteKeys.all, 'detail'] as const,
  detail: (id: string) => [...favouriteKeys.details(), id] as const,
};

export function useFavourites(filters?: FavouriteListFilters) {
  const query = useQuery<FavouriteListResponse, Error>({
    queryKey: favouriteKeys.list(filters),
    queryFn: async () => {
      const response = await getFavourites(filters);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
  });

  return {
    favourites: query.data?.docs || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

export function useFavourite(id: string) {
  const query = useQuery<FavouriteData, Error>({
    queryKey: favouriteKeys.detail(id),
    queryFn: async () => {
      const response = await getFavouriteById(id);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    enabled: !!id,
  });

  return {
    favourite: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCreateFavourite() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: FavouriteCreateInput) => createFavourite(payload),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Favourite added successfully');
        queryClient.invalidateQueries({ queryKey: favouriteKeys.all });
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add favourite');
    },
  });

  return {
    createFavourite: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

export function useUpdateFavourite() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: FavouriteUpdateInput;
    }) => updateFavourite(id, payload),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Favourite updated successfully');
        queryClient.invalidateQueries({ queryKey: favouriteKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update favourite');
    },
  });

  return {
    updateFavourite: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

export function useSoftDeleteFavourite() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => softDeleteFavourite(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Favourite removed successfully');
        queryClient.invalidateQueries({ queryKey: favouriteKeys.all });
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove favourite');
    },
  });

  return {
    softDeleteFavourite: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

export function useHardDeleteFavourite() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => hardDeleteFavourite(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Favourite permanently removed');
        queryClient.invalidateQueries({ queryKey: favouriteKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to permanently remove favourite');
    },
  });

  return {
    hardDeleteFavourite: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

export function useRestoreFavourite() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => restoreFavourite(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Favourite restored successfully');
        queryClient.invalidateQueries({ queryKey: favouriteKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to restore favourite');
    },
  });

  return {
    restoreFavourite: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
