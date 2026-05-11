'use server';
import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';
import {
  PostData,
  PostListResponse,
  PostCreateInput,
  PostUpdateInput,
  PostListBackendResponse,
  PostItemBackendResponse,
  PostListFilters,
} from './post.type';
import {
  postCreateSchema,
  postIdParamsSchema,
  postItemResponseSchema,
  postListResponseSchema,
  postUpdateSchema,
} from './post.validation';
import { ApiResponse } from '@/types/api';

const API_ENDPOINT = '/posts';

export async function getPosts(
  params?: PostListFilters,
): Promise<ApiResponse<PostListResponse>> {
  try {
    const res = await axiosServer.get<PostListBackendResponse>(API_ENDPOINT, {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 10,
        search: params?.search,
        statusId: params?.statusId,
      },
    });
    const backendResponse = await postListResponseSchema.validate(res.data, {
      stripUnknown: true,
    });

    return {
      success: true,
      data: {
        docs: backendResponse.posts || [],
        pagination: backendResponse.pagination,
      },
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to fetch posts');
  }
}

export async function getPostById(id: string): Promise<ApiResponse<PostData>> {
  try {
    await postIdParamsSchema.validate({ id });

    const res = await axiosServer.get<PostItemBackendResponse>(
      `${API_ENDPOINT}/${id}`,
    );

    const backendResponse = await postItemResponseSchema.validate(res.data, {
      stripUnknown: true,
    });

    return {
      success: true,
      data: backendResponse.post,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to fetch post');
  }
}

export async function createPost(
  payload: PostCreateInput,
): Promise<ApiResponse<PostData>> {
  try {
    const validatedData = await postCreateSchema.validate(payload, {
      abortEarly: false,
    });

    const res = await axiosServer.post<PostItemBackendResponse>(
      API_ENDPOINT,
      validatedData,
    );
    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.post,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to create post');
  }
}

export async function updatePost(
  id: string,
  payload: PostUpdateInput,
): Promise<ApiResponse<PostData>> {
  try {
    await postIdParamsSchema.validate({ id });
    const validatedData = await postUpdateSchema.validate(payload, {
      abortEarly: false,
    });

    const res = await axiosServer.put<PostItemBackendResponse>(
      `${API_ENDPOINT}/${id}`,
      validatedData,
    );

    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.post,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to update post');
  }
}

export async function softDeletePost(
  id: string,
): Promise<ApiResponse<PostData>> {
  try {
    await postIdParamsSchema.validate({ id });

    const res = await axiosServer.delete(`${API_ENDPOINT}/${id}/soft`);
    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.post,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to remove post');
  }
}

export async function hardDeletePost(
  id: string,
): Promise<ApiResponse<PostData>> {
  try {
    await postIdParamsSchema.validate({ id });

    const res = await axiosServer.delete(`${API_ENDPOINT}/${id}/hard`);
    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.post,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to permanently remove post');
  }
}

export async function restorePost(id: string): Promise<ApiResponse<PostData>> {
  try {
    await postIdParamsSchema.validate({ id });

    const res = await axiosServer.put<PostItemBackendResponse>(
      `${API_ENDPOINT}/${id}/restore`,
    );

    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.post,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to restore post');
  }
}
