'use server';
import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';
import {
  FavouriteData,
  FavouriteListResponse,
  FavouriteCreateInput,
  FavouriteUpdateInput,
  FavouriteListBackendResponse,
  FavouriteItemBackendResponse,
  FavouriteListFilters,
} from './favourite.type';
import {
  favouriteCreateSchema,
  favouriteIdParamsSchema,
  favouriteItemResponseSchema,
  favouriteListResponseSchema,
  favouriteUpdateSchema,
} from './favourite.validation';
import { ApiResponse } from '@/types/api';

const API_ENDPOINT = '/favourites';

export async function getFavourites(
  filters?: FavouriteListFilters,
): Promise<ApiResponse<FavouriteListResponse>> {
  try {
    const res = await axiosServer.get<FavouriteListBackendResponse>(
      API_ENDPOINT,
      {
        params: filters,
      },
    );

    const backendResponse = await favouriteListResponseSchema.validate(
      res.data,
      {
        stripUnknown: true,
      },
    );

    return {
      success: true,
      data: {
        docs: backendResponse.favourites || [],
        pagination: backendResponse.pagination,
      },
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to fetch favourites');
  }
}

export async function getFavouriteById(
  id: string,
): Promise<ApiResponse<FavouriteData>> {
  try {
    await favouriteIdParamsSchema.validate({ id });

    const res = await axiosServer.get<FavouriteItemBackendResponse>(
      `${API_ENDPOINT}/${id}`,
    );

    const backendResponse = await favouriteItemResponseSchema.validate(
      res.data,
      {
        stripUnknown: true,
      },
    );

    return {
      success: true,
      data: backendResponse.favourite,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to fetch favourite');
  }
}

export async function createFavourite(
  payload: FavouriteCreateInput,
): Promise<ApiResponse<FavouriteData>> {
  try {
    const validatedData = await favouriteCreateSchema.validate(payload, {
      abortEarly: false,
    });

    const res = await axiosServer.post<FavouriteItemBackendResponse>(
      API_ENDPOINT,
      validatedData,
    );
    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.favourite,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to create favourite');
  }
}

export async function updateFavourite(
  id: string,
  payload: FavouriteUpdateInput,
): Promise<ApiResponse<FavouriteData>> {
  try {
    await favouriteIdParamsSchema.validate({ id });
    const validatedData = await favouriteUpdateSchema.validate(payload, {
      abortEarly: false,
    });

    const res = await axiosServer.put<FavouriteItemBackendResponse>(
      `${API_ENDPOINT}/${id}`,
      validatedData,
    );

    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.favourite,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to update favourite');
  }
}

export async function softDeleteFavourite(
  id: string,
): Promise<ApiResponse<FavouriteData>> {
  try {
    await favouriteIdParamsSchema.validate({ id });

    const res = await axiosServer.delete(`${API_ENDPOINT}/${id}/soft`);
    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.favourite,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to remove favourite');
  }
}

export async function hardDeleteFavourite(
  id: string,
): Promise<ApiResponse<FavouriteData>> {
  try {
    await favouriteIdParamsSchema.validate({ id });

    const res = await axiosServer.delete(`${API_ENDPOINT}/${id}/hard`);
    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.favourite,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to permanently remove favourite');
  }
}

export async function restoreFavourite(
  id: string,
): Promise<ApiResponse<FavouriteData>> {
  try {
    await favouriteIdParamsSchema.validate({ id });

    const res = await axiosServer.put<FavouriteItemBackendResponse>(
      `${API_ENDPOINT}/${id}/restore`,
    );

    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.favourite,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to restore favourite');
  }
}
