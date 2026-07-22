'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  softDeletePost,
  hardDeletePost,
  restorePost,
} from './post.server';
import type {
  PostCreateInput,
  PostUpdateInput,
  PostData,
  PostListResponse,
  PostListFilters,
} from './post.type';

// Query keys
export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (filters: PostListFilters) => [...postKeys.lists(), filters] as const,
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (id: string) => [...postKeys.details(), id] as const,
};

// Hook to fetch list of posts
export function usePosts(filters: PostListFilters = {}) {
  const query = useQuery<PostListResponse, Error>({
    queryKey: postKeys.list(filters),
    queryFn: async () => {
      const response = await getPosts();
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
  });

  return {
    posts: query.data?.docs || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

// Hook to fetch a single post by ID
export function usePost(id: string) {
  const query = useQuery<PostData, Error>({
    queryKey: postKeys.detail(id),
    queryFn: async () => {
      const response = await getPostById(id);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    enabled: !!id,
  });

  return {
    post: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

// Hook to create a new post
export function useCreatePost() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: PostCreateInput) => createPost(payload),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Post created successfully');
        queryClient.invalidateQueries({ queryKey: postKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create post');
    },
  });

  return {
    createPost: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

// Hook to update an existing post
export function useUpdatePost() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PostUpdateInput }) =>
      updatePost(id, payload),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Post updated successfully');
        queryClient.invalidateQueries({ queryKey: postKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update post');
    },
  });

  return {
    updatePost: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

// Hook to soft delete a post
export function useSoftDeletePost() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => softDeletePost(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Post removed successfully');
        queryClient.invalidateQueries({ queryKey: postKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove post');
    },
  });

  return {
    softDeletePost: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

// Hook to hard delete a post
export function useHardDeletePost() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => hardDeletePost(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Post permanently removed');
        queryClient.invalidateQueries({ queryKey: postKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to permanently remove post');
    },
  });

  return {
    hardDeletePost: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

// Hook to restore a deleted post
export function useRestorePost() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => restorePost(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Post restored successfully');
        queryClient.invalidateQueries({ queryKey: postKeys.all });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to restore post');
    },
  });

  return {
    restorePost: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
