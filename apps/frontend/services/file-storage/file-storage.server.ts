'use server';

import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';
import {
  getUploadUrlInputSchema,
  fileKeyInputSchema,
  uploadUrlBackendResponseSchema,
  viewUrlBackendResponseSchema,
  deleteBackendResponseSchema,
} from './file-storage.validation';
import type {
  FileStorageApiResponse,
  GetUploadUrlParams,
  GetViewUrlParams,
  DeleteFileParams,
  UploadUrlData,
} from './file-storage.type';

const API_ENDPOINT = '/file-storage';

/**
 * GET UPLOAD URL
 */
export async function getSignedUploadUrl(
  params: GetUploadUrlParams,
): Promise<FileStorageApiResponse<UploadUrlData>> {
  try {
    const validatedParams = await getUploadUrlInputSchema.validate(params);

    const res = await axiosServer.get(`${API_ENDPOINT}/upload-url`, {
      headers: {
        'x-file-name': validatedParams.fileName,
        'x-storage-type': validatedParams.storageType,
      },
    });

    const validated = await uploadUrlBackendResponseSchema.validate(res.data, {
      stripUnknown: true,
    });

    return {
      success: true,
      data: validated.fileStorage,
      message: validated.message || 'Upload URL generated successfully',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to get upload URL');
  }
}
/**
 * GET VIEW URL
 */
export async function getSignedViewUrl(
  params: GetViewUrlParams,
): Promise<FileStorageApiResponse<string>> {
  try {
    const validatedParams = await fileKeyInputSchema.validate(params);

    const res = await axiosServer.get(`${API_ENDPOINT}/view-url`, {
      headers: {
        'x-file-key': validatedParams.fileKey,
      },
    });

    const validated = await viewUrlBackendResponseSchema.validate(res.data, {
      stripUnknown: true,
    });

    return {
      success: true,
      data: validated.fileStorage.signedUrl,
      message: 'View URL fetched successfully',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to fetch view URL');
  }
}

/**
 * DELETE FILE
 */
export async function deleteFileStorage(
  params: DeleteFileParams,
): Promise<FileStorageApiResponse<null>> {
  try {
    const validatedParams = await fileKeyInputSchema.validate(params);

    const res = await axiosServer.delete(API_ENDPOINT, {
      headers: {
        'x-file-key': validatedParams.fileKey,
      },
    });
    const validated = await deleteBackendResponseSchema.validate(res.data, {
      stripUnknown: true,
    });

    return {
      success: true,
      data: null,
      message: res.data?.message || 'File deleted successfully',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to delete file');
  }
}
