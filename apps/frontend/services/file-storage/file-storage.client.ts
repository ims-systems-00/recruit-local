'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getSignedUploadUrl,
  getSignedViewUrl,
  deleteFileStorage,
} from './file-storage.server';
import type {
  GetUploadUrlParams,
  GetViewUrlParams,
  DeleteFileParams,
} from './file-storage.type';
import axios from 'axios';

// --- QUERY KEYS ---
export const fileStorageKeys = {
  all: ['fileStorage'] as const,
  viewUrls: () => [...fileStorageKeys.all, 'viewUrl'] as const,
  viewUrl: (fileKey: string) =>
    [...fileStorageKeys.viewUrls(), fileKey] as const,
};

// --- HOOKS ---

/**
 * Hook to get an upload URL (Mutation so it can be called on demand before uploading)
 */
export function useGetUploadUrl() {
  const mutation = useMutation({
    mutationFn: (params: GetUploadUrlParams) => getSignedUploadUrl(params),
    onError: (error) => {
      toast.error(error.message || 'Failed to generate upload URL');
    },
  });

  return {
    getUploadUrl: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook to fetch a view URL for a specific file key
 */
export function useGetViewUrl({ fileKey }: GetViewUrlParams) {
  const query = useQuery({
    queryKey: fileStorageKeys.viewUrl(fileKey),
    queryFn: async () => {
      const response = await getSignedViewUrl({ fileKey });
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    enabled: !!fileKey,
  });

  return {
    viewUrl: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    error: query.error,
  };
}

/**
 * Hook to delete a file from storage
 */
export function useDeleteFileStorage() {
  const mutation = useMutation({
    mutationFn: (params: DeleteFileParams) => deleteFileStorage(params),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'File deleted successfully');
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete file');
    },
  });

  return {
    deleteFile: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Utility hook to handle the direct-to-S3 PUT upload process.
 */
export function useDirectUpload() {
  const mutation = useMutation({
    mutationFn: async ({
      file,
      signedUrl,
    }: {
      file: File;
      signedUrl: string;
    }) => {
      const response = await axios.put(signedUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
      });
      return response;
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to upload file to storage bucket');
    },
  });

  return {
    uploadFile: mutation.mutateAsync,
    isUploading: mutation.isPending,
  };
}
