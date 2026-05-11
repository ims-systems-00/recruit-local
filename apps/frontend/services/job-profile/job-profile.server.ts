'use server';

import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';
import {
  idParamsSchema,
  createJobProfileSchema,
  updateJobProfileSchema,
  jobProfileListResponseSchema,
  jobProfileItemResponseSchema,
} from './job-profile.validation';
import type {
  JobProfileApiResponse,
  JobProfile,
  JobProfileListResponse,
  JobProfileCreateInput,
  JobProfileUpdateInput,
  JobProfileListFilters,
} from './job-profile.type';

const API_ENDPOINT = '/job-profiles';

/**
 * GET ALL JOB PROFILES
 */
export async function getJobProfiles(
  params?: JobProfileListFilters,
): Promise<JobProfileApiResponse<JobProfileListResponse>> {
  try {
    const res = await axiosServer.get(API_ENDPOINT, {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 10,
        search: params?.search,
      },
    });

    const validated = await jobProfileListResponseSchema.validate(res.data, {
      stripUnknown: true,
    });

    return {
      success: true,
      data: {
        docs: validated.jobProfiles,
        pagination: validated.pagination,
      },
      message: validated.message || 'Job Profiles fetched successfully',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to fetch job profiles');
  }
}

/**
 * GET SINGLE JOB PROFILE
 */
export async function getJobProfileById(
  id: string,
): Promise<JobProfileApiResponse<JobProfile>> {
  try {
    await idParamsSchema.validate({ id });

    const res = await axiosServer.get(`${API_ENDPOINT}/${id}`);

    const validated = await jobProfileItemResponseSchema.validate(res.data, {
      stripUnknown: true,
    });

    return {
      success: true,
      data: validated.jobProfile,
      message: validated.message || 'Job Profile retrieved successfully',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to fetch job profile details');
  }
}

/**
 * CREATE JOB PROFILE
 */
export async function createJobProfile(
  payload: JobProfileCreateInput,
): Promise<JobProfileApiResponse<JobProfile>> {
  try {
    const validatedPayload = await createJobProfileSchema.validate(payload, {
      abortEarly: false,
    });

    const res = await axiosServer.post(API_ENDPOINT, validatedPayload);

    const validatedResponse = await jobProfileItemResponseSchema.validate(
      res.data,
      {
        stripUnknown: true,
      },
    );

    return {
      success: true,
      data: validatedResponse.jobProfile,
      message: validatedResponse.message || 'Job Profile created successfully',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to create job profile');
  }
}

/**
 * UPDATE JOB PROFILE
 */
export async function updateJobProfile(
  id: string,
  payload: JobProfileUpdateInput,
): Promise<JobProfileApiResponse<JobProfile>> {
  try {
    await idParamsSchema.validate({ id });
    const validatedPayload = await updateJobProfileSchema.validate(payload, {
      abortEarly: false,
    });

    const res = await axiosServer.put(
      `${API_ENDPOINT}/${id}`,
      validatedPayload,
    );

    const validatedResponse = await jobProfileItemResponseSchema.validate(
      res.data,
      {
        stripUnknown: true,
      },
    );

    return {
      success: true,
      data: validatedResponse.jobProfile,
      message: validatedResponse.message || 'Job Profile updated successfully',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to update job profile');
  }
}

/**
 * SOFT DELETE JOB PROFILE
 */
export async function softDeleteJobProfile(
  id: string,
): Promise<JobProfileApiResponse<JobProfile>> {
  try {
    await idParamsSchema.validate({ id });
    const res = await axiosServer.delete(`${API_ENDPOINT}/${id}/soft`);

    const validatedResponse = await jobProfileItemResponseSchema.validate(
      res.data,
      {
        stripUnknown: true,
      },
    );

    return {
      success: true,
      data: validatedResponse.jobProfile,
      message: res.data?.message || 'Job Profile moved to trash',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to remove job profile');
  }
}

/**
 * RESTORE JOB PROFILE
 */
export async function restoreJobProfile(
  id: string,
): Promise<JobProfileApiResponse<JobProfile>> {
  try {
    await idParamsSchema.validate({ id });
    const res = await axiosServer.put(`${API_ENDPOINT}/${id}/restore`);

    const validatedResponse = await jobProfileItemResponseSchema.validate(
      res.data,
      {
        stripUnknown: true,
      },
    );

    return {
      success: true,
      data: validatedResponse.jobProfile,
      message: validatedResponse.message || 'Job Profile restored successfully',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to restore job profile');
  }
}

/**
 * HARD DELETE JOB PROFILE
 */
export async function hardDeleteJobProfile(
  id: string,
): Promise<JobProfileApiResponse<JobProfile>> {
  try {
    await idParamsSchema.validate({ id });
    const res = await axiosServer.delete(`${API_ENDPOINT}/${id}/hard`);

    const validatedResponse = await jobProfileItemResponseSchema.validate(
      res.data,
      {
        stripUnknown: true,
      },
    );

    return {
      success: true,
      data: validatedResponse.jobProfile,
      message: res.data?.message || 'Job Profile permanently deleted',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to permanently delete job profile');
  }
}
