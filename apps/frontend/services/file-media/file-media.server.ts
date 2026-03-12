'use server';

import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';

import {
  idParamsSchema,
  createBodySchema,
  updateBodySchema,
  fileMediaListResponseSchema,
  fileMediaItemResponseSchema,
} from './validation';

import type {
  FileMediaApiResponse,
  FileMedia,
  FileMediaListResponse,
  FileMediaCreateInput,
  FileMediaUpdateInput,
  FileMediaListFilters,
} from './file-media.type';

const API_ENDPOINT = '/file-medias';

/**
 * GET ALL FILE MEDIAS
 */
export async function getFileMedias(
  params?: FileMediaListFilters,
): Promise<FileMediaApiResponse<FileMediaListResponse>> {
  try {
    const res = await axiosServer.get(API_ENDPOINT, {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 10,
        search: params?.search,
        collectionName: params?.collectionName,
        visibility: params?.visibility,
      },
    });

    // Validate API Output (Response)
    const validated = await fileMediaListResponseSchema.validate(res.data, {
      stripUnknown: true,
    });

    return {
      success: true,
      data: {
        docs: validated.fileMedias,
        pagination: validated.pagination,
      },
      message: validated.message || 'List fetched successfully',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to fetch file media list');
  }
}

/**
 * GET BY ID
 */
export async function getFileMediaById(
  id: string,
): Promise<FileMediaApiResponse<FileMedia>> {
  try {
    // Validate Input
    await idParamsSchema.validate({ id });

    const res = await axiosServer.get(`${API_ENDPOINT}/${id}`);

    // Validate Response
    const validated = await fileMediaItemResponseSchema.validate(res.data, {
      stripUnknown: true,
    });

    return {
      success: true,
      data: validated.fileMedia,
      message: validated.message || 'Details fetched successfully',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to fetch file media details');
  }
}

/**
 * CREATE
 */
export async function createFileMedia(
  payload: FileMediaCreateInput,
): Promise<FileMediaApiResponse<FileMedia>> {
  try {
    // Validate Input
    const validatedPayload = await createBodySchema.validate(payload, {
      abortEarly: false,
    });

    const res = await axiosServer.post(API_ENDPOINT, validatedPayload);

    // Validate Response
    const validatedResponse = await fileMediaItemResponseSchema.validate(
      res.data,
      {
        stripUnknown: true,
      },
    );

    return {
      success: true,
      data: validatedResponse.fileMedia,
      message: validatedResponse.message || 'Created successfully',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to create file media');
  }
}

/**
 * UPDATE
 */
export async function updateFileMedia(
  id: string,
  payload: FileMediaUpdateInput,
): Promise<FileMediaApiResponse<FileMedia>> {
  try {
    // Validate Inputs
    await idParamsSchema.validate({ id });
    const validatedPayload = await updateBodySchema.validate(payload, {
      abortEarly: false,
    });

    const res = await axiosServer.put(
      `${API_ENDPOINT}/${id}`,
      validatedPayload,
    );

    // Validate Response
    const validatedResponse = await fileMediaItemResponseSchema.validate(
      res.data,
      {
        stripUnknown: true,
      },
    );

    return {
      success: true,
      data: validatedResponse.fileMedia,
      message: validatedResponse.message || 'Updated successfully',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to update file media');
  }
}

/**
 * SOFT DELETE
 */
export async function softDeleteFileMedia(
  id: string,
): Promise<FileMediaApiResponse<FileMedia>> {
  try {
    await idParamsSchema.validate({ id });

    const res = await axiosServer.delete(`${API_ENDPOINT}/${id}/soft`);

    // Validate Response
    const validatedResponse = await fileMediaItemResponseSchema.validate(
      res.data,
      { stripUnknown: true },
    );

    return {
      success: true,
      data: validatedResponse.fileMedia,
      message: res.data?.message || 'File media moved to trash',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to remove file media');
  }
}

/**
 * RESTORE
 */
export async function restoreFileMedia(
  id: string,
): Promise<FileMediaApiResponse<FileMedia>> {
  try {
    await idParamsSchema.validate({ id });

    const res = await axiosServer.put(`${API_ENDPOINT}/${id}/restore`);

    const validatedResponse = await fileMediaItemResponseSchema.validate(
      res.data,
      { stripUnknown: true },
    );

    return {
      success: true,
      data: validatedResponse.fileMedia,
      message: validatedResponse.message || 'Restored successfully',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to restore file media');
  }
}

/**
 * HARD DELETE
 */
export async function hardDeleteFileMedia(
  id: string,
): Promise<FileMediaApiResponse<FileMedia>> {
  try {
    await idParamsSchema.validate({ id });

    const res = await axiosServer.delete(`${API_ENDPOINT}/${id}/hard`);

    const validatedResponse = await fileMediaItemResponseSchema.validate(
      res.data,
      { stripUnknown: true },
    );

    return {
      success: true,
      data: validatedResponse.fileMedia,
      message: res.data?.message || 'File media permanently removed',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to permanently remove file media');
  }
}
