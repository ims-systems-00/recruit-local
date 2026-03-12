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
  EducationListBackendResponse,
  EducationItemBackendResponse,
  EducationListFilters,
} from './education.type';

export async function getEducations(
  params?: EducationListFilters,
): Promise<EducationApiResponse<EducationListResponse>> {
  try {
    const res = await axiosServer.get<EducationListBackendResponse>(
      '/educations',
      {
        params: {
          page: params?.page || 1,
          limit: params?.limit || 10,
          search: params?.search,
        },
      },
    );
    const backendResponse = res.data;

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
): Promise<EducationApiResponse<EducationData>> {
  try {
    await educationIdParamsSchema.validate({ id });

    const res =
      await axiosServer.get<EducationItemBackendResponse>(`/educations/${id}`);

    const backendResponse = res.data;

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
): Promise<EducationApiResponse<EducationData>> {
  try {
    const validatedData = await educationCreateSchema.validate(payload, {
      abortEarly: false,
    });

    const res = await axiosServer.post<EducationItemBackendResponse>(
      '/educations',
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
): Promise<EducationApiResponse<EducationData>> {
  try {
    await educationIdParamsSchema.validate({ id });
    const validatedData = await educationUpdateSchema.validate(payload, {
      abortEarly: false,
    });

    const res = await axiosServer.put<EducationItemBackendResponse>(
      `/educations/${id}`,
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
): Promise<EducationApiResponse<void>> {
  try {
    // Validate ID
    await educationIdParamsSchema.validate({ id });

    const res = await axiosServer.delete(`/educations/${id}/soft`);
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
): Promise<EducationApiResponse<void>> {
  try {
    // Validate ID
    await educationIdParamsSchema.validate({ id });

    const res = await axiosServer.delete(`/educations/${id}/hard`);
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
): Promise<EducationApiResponse<EducationData>> {
  try {
    await educationIdParamsSchema.validate({ id });

    const res = await axiosServer.put<EducationItemBackendResponse>(
      `/educations/${id}/restore`,
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
