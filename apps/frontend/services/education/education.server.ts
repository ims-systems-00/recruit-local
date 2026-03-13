'use server';
import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';
import {
  EducationData,
  EducationListResponse,
  EducationCreateInput,
  EducationUpdateInput,
  EducationListBackendResponse,
  EducationItemBackendResponse,
  EducationListFilters,
} from './education.type';
import { ApiResponse } from '@/types/api';
import { educationCreateSchema, educationIdParamsSchema, educationItemResponseSchema, educationListResponseSchema, educationUpdateSchema } from './education.validation';

const API_ENDPOINT = '/educations';

export async function getEducations(
  params?: EducationListFilters,
): Promise<ApiResponse<EducationListResponse>> {
  try {
    const res = await axiosServer.get<EducationListBackendResponse>(
      API_ENDPOINT,
      {
        params: {
          page: params?.page || 1,
          limit: params?.limit || 10,
          search: params?.search,
        },
      },
    );

    const backendResponse = await educationListResponseSchema.validate(res.data, {
      stripUnknown: true,
    });

    return {
      success: true,
      data: {
        docs: backendResponse.educations || [],
        pagination: backendResponse.pagination,
      },
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to fetch educations');
  }
}

export async function getEducationById(
  id: string,
): Promise<ApiResponse<EducationData>> {
  try {
    await educationIdParamsSchema.validate({ id });

    const res =
      await axiosServer.get<EducationItemBackendResponse>(`${API_ENDPOINT}/${id}`);

    const backendResponse = await educationItemResponseSchema.validate(res.data, {
      stripUnknown: true,
    });

    return {
      success: true,
      data: backendResponse.education,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to fetch education');
  }
}

export async function createEducation(
  payload: EducationCreateInput,
): Promise<ApiResponse<EducationData>> {
  try {
    const validatedData = await educationCreateSchema.validate(payload, {
      abortEarly: false,
    });

    const res = await axiosServer.post<EducationItemBackendResponse>(
      API_ENDPOINT,
      validatedData,
    );
    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.education,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to create education');
  }
}

export async function updateEducation(
  id: string,
  payload: EducationUpdateInput,
): Promise<ApiResponse<EducationData>> {
  try {
    await educationIdParamsSchema.validate({ id });
    const validatedData = await educationUpdateSchema.validate(payload, {
      abortEarly: false,
    });

    const res = await axiosServer.put<EducationItemBackendResponse>(
      `${API_ENDPOINT}/${id}`,
      validatedData,
    );

   const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.education,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to update education');
  }
}

export async function softDeleteEducation(
  id: string,
): Promise<ApiResponse<EducationData>> {
  try {
    // Validate ID
    await educationIdParamsSchema.validate({ id });

    const res = await axiosServer.delete(`${API_ENDPOINT}/${id}/soft`);
    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.education,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to remove education');
  }
}

export async function hardDeleteEducation(
  id: string,
): Promise<ApiResponse<EducationData>> {
  try {
    // Validate ID
    await educationIdParamsSchema.validate({ id });

    const res = await axiosServer.delete(`${API_ENDPOINT}/${id}/hard`);
    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.education,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to permanently remove education');
  }
}

export async function restoreEducation(
  id: string,
): Promise<ApiResponse<EducationData>> {
  try {
    await educationIdParamsSchema.validate({ id });

    const res = await axiosServer.put<EducationItemBackendResponse>(
      `${API_ENDPOINT}/${id}/restore`,
    );
    
    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.education,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to restore education');
  }
}
