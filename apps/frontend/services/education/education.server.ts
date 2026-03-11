'use server';
import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';
import {
  EducationApiResponse,
  EducationData,
  EducationListResponse,
  EducationCreateInput,
  EducationUpdateInput,
  educationCreateSchema,
  educationUpdateSchema,
  educationIdParamsSchema,
} from './education.type';

export async function getEducations(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<EducationApiResponse<EducationListResponse>> {
  try {
    const res = await axiosServer.get('/educations', {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 10,
        search: params?.search,
      },
    });
    const backendResponse = res.data;

    return {
      success: true,
      data: {
        docs: backendResponse.educations || [],
        pagination: backendResponse.pagination || {},
      } as EducationListResponse,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to fetch educations');
  }
}

export async function getEducationById(
  id: string,
): Promise<EducationApiResponse<EducationData>> {
  try {
    await educationIdParamsSchema.validate({ id });

    const res = await axiosServer.get(`/educations/${id}`);

    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.education as EducationData,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to fetch education');
  }
}

export async function createEducation(
  payload: EducationCreateInput,
): Promise<EducationApiResponse<EducationData>> {
  try {
    const validatedData = await educationCreateSchema.validate(payload, {
      abortEarly: false,
    });

    const res = await axiosServer.post('/educations', validatedData);
    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.education as EducationData,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to create education');
  }
}

export async function updateEducation(
  id: string,
  payload: EducationUpdateInput,
): Promise<EducationApiResponse<EducationData>> {
  try {
    await educationIdParamsSchema.validate({ id });
    const validatedData = await educationUpdateSchema.validate(payload, {
      abortEarly: false,
    });
    console.log(validatedData);

    const res = await axiosServer.put(`/educations/${id}`, payload);


    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.education as EducationData,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to update education');
  }
}

export async function softDeleteEducation(
  id: string,
): Promise<EducationApiResponse<void>> {
  try {
    // Validate ID
    await educationIdParamsSchema.validate({ id });

    await axiosServer.delete(`/educations/${id}/soft`);

    return {
      success: true,
      data: undefined,
      message: 'Education removed successfully',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to remove education');
  }
}

export async function hardDeleteEducation(
  id: string,
): Promise<EducationApiResponse<void>> {
  try {
    // Validate ID
    await educationIdParamsSchema.validate({ id });

    await axiosServer.delete(`/educations/${id}/hard`);

    return {
      success: true,
      data: undefined,
      message: 'Education permanently removed',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to permanently remove education');
  }
}

export async function restoreEducation(
  id: string,
): Promise<EducationApiResponse<EducationData>> {
  try {
    await educationIdParamsSchema.validate({ id });

    const res = await axiosServer.put(`/educations/${id}/restore`);

    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.education as EducationData,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to restore education');
  }
}
