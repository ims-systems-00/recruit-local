'use server';

import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';
import {
  idParamsSchema,
  applicationListResponseSchema,
  createApplicationSchema,
  updateApplicationSchema,
  applicationItemResponseSchema,
  moveApplicationToColumnSchema,
} from './application.validation';
import type {
  ApplicationListFilters,
  ApplicationApiResponse,
  ApplicationListResponse,
  Application,
  ApplicationCreateInput,
  ApplicationUpdateInput,
  MoveApplicationToColumnInput,
} from './application.type';

const API_ENDPOINT = '/applications';

/**
 * GET ALL JOB PROFILES
 */
export async function getApplications(
  params?: ApplicationListFilters,
): Promise<ApplicationApiResponse<ApplicationListResponse>> {
  try {
    const res = await axiosServer.get(API_ENDPOINT, {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 10,
        clientSearch: params?.clientSearch,
        jobId: params?.jobId,
        statusId: params?.statusId,
      },
    });

    // const validated = await applicationListResponseSchema.validate(res.data, {
    //   stripUnknown: true,
    // });

    return {
      success: true,
      data: {
        docs: res.data.applications,
        pagination: res.data.pagination,
      },
      message: res.data.message || 'Applications fetched successfully',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to fetch applications');
  }
}

/**
 * GET SINGLE JOB PROFILE
 */
export async function getApplicationById(
  id: string,
): Promise<ApplicationApiResponse<Application>> {
  try {
    await idParamsSchema.validate({ id });

    const res = await axiosServer.get(`${API_ENDPOINT}/${id}`);

    // const validated = await jobProfileItemResponseSchema.validate(res.data, {
    //   stripUnknown: true,
    // });

    return {
      success: true,
      data: res.data.application,
      message: res.data.message || 'Application retrieved successfully',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to fetch application details');
  }
}

/**
 * CREATE APPLICATION
 */
export async function createApplication(
  payload: ApplicationCreateInput,
): Promise<ApplicationApiResponse<Application>> {
  try {
    const validatedPayload = await createApplicationSchema.validate(payload, {
      abortEarly: false,
    });

    const res = await axiosServer.post(API_ENDPOINT, validatedPayload);

    // const validatedResponse = await jobProfileItemResponseSchema.validate(
    //   res.data,
    //   {
    //     stripUnknown: true,
    //   },
    // );

    return {
      success: true,
      data: res.data.application,
      message: res.data.message || 'Application created successfully',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to create application');
  }
}

/**
 * UPDATE APPLICATION
 */
export async function updateApplication(
  id: string,
  payload: ApplicationUpdateInput,
): Promise<ApplicationApiResponse<Application>> {
  try {
    await idParamsSchema.validate({ id });
    const validatedPayload = await updateApplicationSchema.validate(payload, {
      abortEarly: false,
    });

    const res = await axiosServer.put(
      `${API_ENDPOINT}/${id}`,
      validatedPayload,
    );

    // const validatedResponse = await jobProfileItemResponseSchema.validate(
    //   res.data,
    //   {
    //     stripUnknown: true,
    //   },
    // );

    return {
      success: true,
      data: res.data.application,
      message: res.data.message || 'Application updated successfully',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to update application');
  }
}

/**
 * SOFT DELETE APPLICATION
 */
export async function softDeleteApplication(
  id: string,
): Promise<ApplicationApiResponse<Application>> {
  try {
    await idParamsSchema.validate({ id });
    const res = await axiosServer.delete(`${API_ENDPOINT}/${id}/soft`);

    const validatedResponse = await applicationItemResponseSchema.validate(
      res.data,
      {
        stripUnknown: true,
      },
    );

    return {
      success: true,
      data: validatedResponse.application,
      message: res.data?.message || 'Application moved to trash',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to remove application');
  }
}

/**
 * RESTORE APPLICATION
 */
export async function restoreApplication(
  id: string,
): Promise<ApplicationApiResponse<Application>> {
  try {
    await idParamsSchema.validate({ id });
    const res = await axiosServer.put(`${API_ENDPOINT}/${id}/restore`);

    const validatedResponse = await applicationItemResponseSchema.validate(
      res.data,
      {
        stripUnknown: true,
      },
    );

    return {
      success: true,
      data: validatedResponse.application,
      message: validatedResponse.message || 'Application restored successfully',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to restore application');
  }
}

/**
 * HARD DELETE APPLICATION
 */
export async function hardDeleteApplication(
  id: string,
): Promise<ApplicationApiResponse<Application>> {
  try {
    await idParamsSchema.validate({ id });
    const res = await axiosServer.delete(`${API_ENDPOINT}/${id}/hard`);

    const validatedResponse = await applicationItemResponseSchema.validate(
      res.data,
      {
        stripUnknown: true,
      },
    );

    return {
      success: true,
      data: validatedResponse.application,
      message: res.data?.message || 'Application permanently deleted',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to permanently delete application');
  }
}

//board/move/69b124a5fb8456ea401ceb1e
//body: { targetStatusId: '69b124a5fb8456ea401ceb1e', targetIndex: 0 }

export async function moveApplicationToColumn(
  id: string,
  payload: MoveApplicationToColumnInput,
): Promise<ApplicationApiResponse<Application>> {
  console.log('payload', payload);
  try {
    await idParamsSchema.validate({ id });
    const validatedPayload = await moveApplicationToColumnSchema.validate(
      payload,
      {
        abortEarly: false,
      },
    );

    const res = await axiosServer.post(
      `${API_ENDPOINT}/board/move/${id}`,
      validatedPayload,
    );

    // const validatedResponse = await jobProfileItemResponseSchema.validate(
    //   res.data,
    //   {
    //     stripUnknown: true,
    //   },
    // );

    return {
      success: true,
      data: res.data.application,
      message: res.data.message || 'Application moved to column successfully',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to move application to column');
  }
}
