'use server';
import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';
import {
  InterestData,
  InterestListResponse,
  InterestCreateInput,
  InterestUpdateInput,
  InterestListBackendResponse,
  InterestItemBackendResponse,
  InterestListFilters,
} from './interest.type';
import { ApiResponse } from '@/types/api';
import {
  interestCreateSchema,
  interestIdParamsSchema,
  interestItemResponseSchema,
  interestListResponseSchema,
  interestUpdateSchema,
} from './interest.validation';

const API_ENDPOINT = '/interests';

export async function getInterests(
  params?: InterestListFilters,
): Promise<ApiResponse<InterestListResponse>> {
  try {
    const res = await axiosServer.get<InterestListBackendResponse>(
      API_ENDPOINT,
      {
        params: {
          page: params?.page || 1,
          limit: params?.limit || 10,
          search: params?.search,
        },
      },
    );
    const backendResponse = res.data;

    // const backendResponse = await interestListResponseSchema.validate(res.data, {
    //     stripUnknown: true,
    // });

    return {
      success: true,
      data: {
        docs: backendResponse.interests || [],
        pagination: backendResponse.pagination,
      },
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to fetch interests');
  }
}

export async function getInterestById(
  id: string,
): Promise<ApiResponse<InterestData>> {
  try {
    await interestIdParamsSchema.validate({ id });

    const res = await axiosServer.get<InterestItemBackendResponse>(
      `${API_ENDPOINT}/${id}`,
    );

    const backendResponse = await interestItemResponseSchema.validate(
      res.data,
      {
        stripUnknown: true,
      },
    );

    return {
      success: true,
      data: backendResponse.interest,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to fetch interest');
  }
}

export async function createInterest(
  payload: InterestCreateInput,
): Promise<ApiResponse<InterestData>> {
  try {
    const validatedData = await interestCreateSchema.validate(payload, {
      abortEarly: false,
    });

    const res = await axiosServer.post<InterestItemBackendResponse>(
      API_ENDPOINT,
      validatedData,
    );
    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.interest,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to create interest');
  }
}

export async function updateInterest(
  id: string,
  payload: InterestUpdateInput,
): Promise<ApiResponse<InterestData>> {
  try {
    await interestIdParamsSchema.validate({ id });
    const validatedData = await interestUpdateSchema.validate(payload, {
      abortEarly: false,
    });

    const res = await axiosServer.put<InterestItemBackendResponse>(
      `${API_ENDPOINT}/${id}`,
      validatedData,
    );

    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.interest,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to update interest');
  }
}

export async function softDeleteInterest(
  id: string,
): Promise<ApiResponse<InterestData>> {
  try {
    // Validate ID
    await interestIdParamsSchema.validate({ id });

    const res = await axiosServer.delete(`${API_ENDPOINT}/${id}/soft`);
    const backendResponse = await interestItemResponseSchema.validate(
      res.data,
      {
        stripUnknown: true,
      },
    );

    return {
      success: true,
      data: backendResponse.interest,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to remove interest');
  }
}

export async function hardDeleteInterest(
  id: string,
): Promise<ApiResponse<InterestData>> {
  try {
    // Validate ID
    await interestIdParamsSchema.validate({ id });

    const res = await axiosServer.delete(`${API_ENDPOINT}/${id}/hard`);
    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.interest,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to permanently remove interest');
  }
}

export async function restoreInterest(
  id: string,
): Promise<ApiResponse<InterestData>> {
  try {
    await interestIdParamsSchema.validate({ id });

    const res = await axiosServer.put<InterestItemBackendResponse>(
      `${API_ENDPOINT}/${id}/restore`,
    );

    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.interest,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to restore interest');
  }
}
