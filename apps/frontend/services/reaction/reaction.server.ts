'use server';
import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';
import {
  ReactionData,
  ReactionListResponse,
  ReactionCreateInput,
  ReactionUpdateInput,
  ReactionListBackendResponse,
  ReactionItemBackendResponse,
  ReactionListFilters,
} from './reaction.type';
import {
  reactionCreateSchema,
  reactionIdParamsSchema,
  reactionItemResponseSchema,
  reactionListResponseSchema,
  reactionUpdateSchema,
} from './reaction.validation';
import { ApiResponse } from '@/types/api';

const API_ENDPOINT = '/reactions';

export async function getReactions(
  filters: ReactionListFilters,
): Promise<ApiResponse<ReactionListResponse>> {
  try {
    const res = await axiosServer.get<ReactionListBackendResponse>(
      API_ENDPOINT,
      {
        params: {
          collectionId: filters.collectionId,
          collectionName: filters.collectionName,
        },
      },
    );

    const backendResponse = await reactionListResponseSchema.validate(
      res.data,
      {
        stripUnknown: true,
      },
    );

    return {
      success: true,
      data: {
        docs: backendResponse.reactions || [],
        pagination: backendResponse.pagination,
      },
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to fetch reactions');
  }
}

export async function getReactionById(
  id: string,
): Promise<ApiResponse<ReactionData>> {
  try {
    await reactionIdParamsSchema.validate({ id });

    const res = await axiosServer.get<ReactionItemBackendResponse>(
      `${API_ENDPOINT}/${id}`,
    );

    const backendResponse = await reactionItemResponseSchema.validate(
      res.data,
      {
        stripUnknown: true,
      },
    );

    return {
      success: true,
      data: backendResponse.reaction,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to fetch reaction');
  }
}

export async function createReaction(
  payload: ReactionCreateInput,
): Promise<ApiResponse<ReactionData>> {
  try {
    const validatedData = await reactionCreateSchema.validate(payload, {
      abortEarly: false,
    });

    const res = await axiosServer.post<ReactionItemBackendResponse>(
      API_ENDPOINT,
      validatedData,
    );
    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.reaction,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to create reaction');
  }
}

export async function updateReaction(
  id: string,
  payload: ReactionUpdateInput,
): Promise<ApiResponse<ReactionData>> {
  try {
    await reactionIdParamsSchema.validate({ id });
    const validatedData = await reactionUpdateSchema.validate(payload, {
      abortEarly: false,
    });

    const res = await axiosServer.put<ReactionItemBackendResponse>(
      `${API_ENDPOINT}/${id}`,
      validatedData,
    );

    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.reaction,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to update reaction');
  }
}

export async function softDeleteReaction(
  id: string,
): Promise<ApiResponse<ReactionData>> {
  try {
    await reactionIdParamsSchema.validate({ id });

    const res = await axiosServer.delete(`${API_ENDPOINT}/${id}/soft`);
    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.reaction,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to remove reaction');
  }
}

export async function hardDeleteReaction(
  id: string,
): Promise<ApiResponse<ReactionData>> {
  try {
    await reactionIdParamsSchema.validate({ id });

    const res = await axiosServer.delete(`${API_ENDPOINT}/${id}/hard`);
    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.reaction,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to permanently remove reaction');
  }
}

export async function restoreReaction(
  id: string,
): Promise<ApiResponse<ReactionData>> {
  try {
    await reactionIdParamsSchema.validate({ id });

    const res = await axiosServer.put<ReactionItemBackendResponse>(
      `${API_ENDPOINT}/${id}/restore`,
    );

    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.reaction,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to restore reaction');
  }
}
