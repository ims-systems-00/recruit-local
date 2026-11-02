'use server';
import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';
import {
  TrainingData,
  TrainingListResponse,
  TrainingCreateInput,
  TrainingUpdateInput,
  TrainingListBackendResponse,
  TrainingItemBackendResponse,
  TrainingListFilters,
} from './training.type';
import { ApiResponse } from '@/types/api';
import {
  trainingCreateSchema,
  trainingIdParamsSchema,
  trainingItemResponseSchema,
  trainingUpdateSchema,
} from './training.validation';

const API_ENDPOINT = '/trainings';

export async function getTrainings(
  params?: TrainingListFilters,
): Promise<ApiResponse<TrainingListResponse>> {
  try {
    const res = await axiosServer.get<TrainingListBackendResponse>(
      API_ENDPOINT,
      {
        params: {
          cursor: params?.cursor,
          limit: params?.limit || 10,
          jobProfileId: params?.jobProfileId,
        },
      },
    );

    return {
      success: true,
      data: {
        docs: res.data.trainings || [],
        pagination: res.data.pagination,
      },
      message: res.data.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to fetch trainings');
  }
}

export async function getTrainingById(
  id: string,
): Promise<ApiResponse<TrainingData>> {
  try {
    await trainingIdParamsSchema.validate({ id });

    const res = await axiosServer.get<TrainingItemBackendResponse>(
      `${API_ENDPOINT}/${id}`,
    );

    const backendResponse = await trainingItemResponseSchema.validate(
      res.data,
      {
        stripUnknown: true,
      },
    );

    return {
      success: true,
      data: backendResponse.training as TrainingData,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to fetch training');
  }
}

export async function createTraining(
  payload: TrainingCreateInput,
): Promise<ApiResponse<TrainingData>> {
  try {
    const validatedData = await trainingCreateSchema.validate(payload, {
      abortEarly: false,
    });

    const res = await axiosServer.post<TrainingItemBackendResponse>(
      API_ENDPOINT,
      validatedData,
    );
    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.training,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to create training');
  }
}

export async function updateTraining(
  id: string,
  payload: TrainingUpdateInput,
): Promise<ApiResponse<TrainingData>> {
  try {
    await trainingIdParamsSchema.validate({ id });
    const validatedData = await trainingUpdateSchema.validate(payload, {
      abortEarly: false,
    });

    const res = await axiosServer.put<TrainingItemBackendResponse>(
      `${API_ENDPOINT}/${id}`,
      validatedData,
    );

    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.training,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to update training');
  }
}

export async function softDeleteTraining(
  id: string,
): Promise<ApiResponse<TrainingData>> {
  try {
    await trainingIdParamsSchema.validate({ id });

    const res = await axiosServer.delete<TrainingItemBackendResponse>(
      `${API_ENDPOINT}/${id}/soft`,
    );
    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.training,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to remove training');
  }
}

export async function hardDeleteTraining(
  id: string,
): Promise<ApiResponse<TrainingData>> {
  try {
    await trainingIdParamsSchema.validate({ id });

    const res = await axiosServer.delete<TrainingItemBackendResponse>(
      `${API_ENDPOINT}/${id}/hard`,
    );
    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.training,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to permanently remove training');
  }
}

export async function restoreTraining(
  id: string,
): Promise<ApiResponse<TrainingData>> {
  try {
    await trainingIdParamsSchema.validate({ id });

    const res = await axiosServer.put<TrainingItemBackendResponse>(
      `${API_ENDPOINT}/${id}/restore`,
    );

    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.training,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to restore training');
  }
}
