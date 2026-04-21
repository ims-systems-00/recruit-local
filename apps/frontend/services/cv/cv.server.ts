'use server';

import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';
import {
  idParamsSchema,
  createCvSchema,
  updateCvSchema,
  cvListResponseSchema,
  cvItemResponseSchema,
  cvActionResponseSchema,
} from './cv.validation';
import type {
  CvApiResponse,
  Cv,
  CvListResponse,
  CvCreateInput,
  CvUpdateInput,
  CvListFilters,
} from './cv.type';

const API_ENDPOINT = '/cvs';

/**
 * GET ALL CVS
 */
export async function getCvs(
  params?: CvListFilters,
): Promise<CvApiResponse<CvListResponse>> {
  try {
    const res = await axiosServer.get(API_ENDPOINT, {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 10,
        search: params?.search,
      },
    });

    // const validated = await cvListResponseSchema.validate(res.data, {
    //   stripUnknown: true,
    // });

    return {
      success: true,
      data: {
        docs: res.data.cvs,
        pagination: res.data.pagination,
      },
      message: res.data.message || 'CVs fetched successfully',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to fetch CVs');
  }
}

/**
 * GET SINGLE CV
 */
export async function getCvById(id: string): Promise<CvApiResponse<Cv>> {
  try {
    await idParamsSchema.validate({ id });

    const res = await axiosServer.get(`${API_ENDPOINT}/${id}`);

    // const validated = await cvItemResponseSchema.validate(res.data, {
    //   stripUnknown: true,
    // });

    return {
      success: true,
      data: res.data.cv,
      message: res.data.message || 'CV retrieved successfully',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to fetch CV details');
  }
}

/**
 * CREATE CV
 */
export async function createCv(
  payload: CvCreateInput,
): Promise<CvApiResponse<Cv>> {
  try {
    const validatedPayload = await createCvSchema.validate(payload, {
      abortEarly: false,
    });

    const res = await axiosServer.post(API_ENDPOINT, validatedPayload);

    // const validatedResponse = await cvItemResponseSchema.validate(res.data, {
    //     stripUnknown: true,
    // });

    return {
      success: true,
      data: res.data.cv,
      message: res.data.message || 'CV created successfully',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to create CV');
  }
}

/**
 * UPDATE CV
 */
export async function updateCv(
  id: string,
  payload: CvUpdateInput,
): Promise<CvApiResponse<Cv>> {
  try {
    await idParamsSchema.validate({ id });
    const validatedPayload = await updateCvSchema.validate(payload, {
      abortEarly: false,
    });

    const res = await axiosServer.put(
      `${API_ENDPOINT}/${id}`,
      validatedPayload,
    );

    // const validatedResponse = await cvItemResponseSchema.validate(res.data, {
    //   stripUnknown: true,
    // });

    return {
      success: true,
      data: res.data.cv,
      message: res.data.message || 'CV updated successfully',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to update CV');
  }
}

/**
 * SOFT DELETE CV
 */
export async function softDeleteCv(id: string): Promise<CvApiResponse<null>> {
  try {
    await idParamsSchema.validate({ id });
    const res = await axiosServer.delete(`${API_ENDPOINT}/${id}/soft`);

    // const validatedResponse = await cvActionResponseSchema.validate(res.data, {
    //   stripUnknown: true,
    // });

    return {
      success: true,
      data: null,
      message: res.data.message || 'CV moved to trash',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to remove CV');
  }
}

/**
 * RESTORE CV
 */
export async function restoreCv(id: string): Promise<CvApiResponse<null>> {
  try {
    await idParamsSchema.validate({ id });
    const res = await axiosServer.put(`${API_ENDPOINT}/${id}/restore`);

    const validatedResponse = await cvActionResponseSchema.validate(res.data, {
      stripUnknown: true,
    });

    return {
      success: true,
      data: null,
      message: validatedResponse.message || 'CV restored successfully',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to restore CV');
  }
}

/**
 * HARD DELETE CV
 */
export async function hardDeleteCv(id: string): Promise<CvApiResponse<null>> {
  try {
    await idParamsSchema.validate({ id });
    const res = await axiosServer.delete(`${API_ENDPOINT}/${id}/hard`);

    const validatedResponse = await cvActionResponseSchema.validate(res.data, {
      stripUnknown: true,
    });

    return {
      success: true,
      data: null,
      message: validatedResponse.message || 'CV permanently deleted',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to permanently delete CV');
  }
}
