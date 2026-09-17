'use server';
import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';
import {
  StatusData,
  StatusListResponse,
  StatusCreateInput,
  StatusUpdateInput,
  StatusListBackendResponse,
  StatusItemBackendResponse,
  StatusListFilters,
  StatusReorderInput,
  StatusReorderBackendResponse,
} from './status.type';
import {
  statusCreateSchema,
  statusIdParamsSchema,
  statusItemResponseSchema,
  statusListResponseSchema,
  statusUpdateSchema,
} from './status.validation';
import { ApiResponse } from '@/types/api';

const API_ENDPOINT = '/statuses';

export async function getStatuses(
  params?: StatusListFilters,
): Promise<ApiResponse<StatusListResponse>> {
  try {
    const res = await axiosServer.get<StatusListBackendResponse>(API_ENDPOINT, {
      params: {
        cursor: params?.cursor,
        limit: params?.limit || 10,
        collectionName: params?.collectionName,
        collectionId: params?.collectionId,
        label: params?.label,
      },
    });
    const backendResponse = await statusListResponseSchema.validate(res.data, {
      stripUnknown: true,
    });

    return {
      success: true,
      data: {
        docs: backendResponse.statuses || [],
        pagination: backendResponse.pagination,
      },
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to fetch statuses');
  }
}

// The backend caps `limit` at 100.
const ALL_STATUSES_PAGE_SIZE = 100;
// Guards against a cursor that never ends (10,000 statuses).
const ALL_STATUSES_MAX_PAGES = 100;

/**
 * GET EVERY STATUS matching the filters, following `nextCursor` to the last
 * page. For callers that need the complete set, e.g. the kanban board, where a
 * missing status is a missing column.
 */
export async function getAllStatuses(
  params?: Omit<StatusListFilters, 'cursor' | 'limit'>,
): Promise<ApiResponse<StatusListResponse>> {
  const docs: StatusData[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < ALL_STATUSES_MAX_PAGES; page++) {
    const response = await getStatuses({
      ...params,
      cursor,
      limit: ALL_STATUSES_PAGE_SIZE,
    });
    if (!response.success) return response;

    docs.push(...response.data.docs);

    const { hasNextPage, nextCursor } = response.data.pagination;
    if (!hasNextPage || !nextCursor) {
      return {
        success: true,
        data: { docs, pagination: response.data.pagination },
        message: response.message,
      };
    }
    cursor = nextCursor;
  }

  return { success: false, message: 'Too many statuses to load.' };
}

export async function getStatusById(
  id: string,
): Promise<ApiResponse<StatusData>> {
  try {
    await statusIdParamsSchema.validate({ id });

    const res = await axiosServer.get<StatusItemBackendResponse>(
      `${API_ENDPOINT}/${id}`,
    );

    const backendResponse = await statusItemResponseSchema.validate(res.data, {
      stripUnknown: true,
    });

    return {
      success: true,
      data: backendResponse.status,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to fetch status');
  }
}

export async function createStatus(
  payload: StatusCreateInput,
): Promise<ApiResponse<StatusData>> {
  try {
    const validatedData = await statusCreateSchema.validate(payload, {
      abortEarly: false,
    });

    const res = await axiosServer.post<StatusItemBackendResponse>(
      API_ENDPOINT,
      validatedData,
    );
    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.status,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to create status');
  }
}

export async function reorderStatuses(
  payload: StatusReorderInput,
): Promise<ApiResponse<StatusData[]>> {
  try {
    const res = await axiosServer.put<StatusReorderBackendResponse>(
      `${API_ENDPOINT}/reorder`,
      payload,
    );

    return {
      success: true,
      data: res.data.statuses,
      message: res.data.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to reorder statuses');
  }
}

export async function updateStatus(
  id: string,
  payload: StatusUpdateInput,
): Promise<ApiResponse<StatusData>> {
  try {
    await statusIdParamsSchema.validate({ id });
    const validatedData = await statusUpdateSchema.validate(payload, {
      abortEarly: false,
    });

    const res = await axiosServer.put<StatusItemBackendResponse>(
      `${API_ENDPOINT}/${id}`,
      validatedData,
    );

    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.status,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to update status');
  }
}

export async function softDeleteStatus(
  id: string,
): Promise<ApiResponse<StatusData>> {
  try {
    await statusIdParamsSchema.validate({ id });

    const res = await axiosServer.delete(`${API_ENDPOINT}/${id}/soft`);
    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.status,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to remove status');
  }
}

export async function hardDeleteStatus(
  id: string,
): Promise<ApiResponse<StatusData>> {
  try {
    await statusIdParamsSchema.validate({ id });

    const res = await axiosServer.delete(`${API_ENDPOINT}/${id}/hard`);
    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.status,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to permanently remove status');
  }
}

export async function restoreStatus(
  id: string,
): Promise<ApiResponse<StatusData>> {
  try {
    await statusIdParamsSchema.validate({ id });

    const res = await axiosServer.put<StatusItemBackendResponse>(
      `${API_ENDPOINT}/${id}/restore`,
    );

    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.status,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to restore status');
  }
}
