'use server';
import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';
import {
    EventData,
    EventListResponse,
    EventCreateInput,
    EventUpdateInput,
    EventListBackendResponse,
    EventItemBackendResponse,
    EventListFilters,
} from './event.type';
import {
    eventCreateSchema,
    eventIdParamsSchema,
    eventItemResponseSchema,
    eventListResponseSchema,
    eventUpdateSchema
} from './event.validation';
import { ApiResponse } from '@/types/api';

const API_ENDPOINT = '/events';

export async function getEvents(
    params?: EventListFilters,
): Promise<ApiResponse<EventListResponse>> {
    try {
        const res = await axiosServer.get<EventListBackendResponse>(
            API_ENDPOINT,
            {
                params: {
                    page: params?.page || 1,
                    limit: params?.limit || 10,

                },
            },
        );
        const backendResponse = await eventListResponseSchema.validate(res.data, {
            stripUnknown: true,
        });

        return {
            success: true,
            data: {
                docs: backendResponse.events || [],
                pagination: backendResponse.pagination,
            },
            message: backendResponse.message,
        };
    } catch (error) {
        return handleServerError(error, 'Failed to fetch events');
    }
}

export async function getEventById(
    id: string,
): Promise<ApiResponse<EventData>> {
    try {
        await eventIdParamsSchema.validate({ id });

        const res =
            await axiosServer.get<EventItemBackendResponse>(`${API_ENDPOINT}/${id}`);

        const backendResponse = await eventItemResponseSchema.validate(res.data, {
            stripUnknown: true,
        });

        return {
            success: true,
            data: backendResponse.event,
            message: backendResponse.message,
        };
    } catch (error) {
        return handleServerError(error, 'Failed to fetch event');
    }
}

export async function createEvent(
    payload: EventCreateInput,
): Promise<ApiResponse<EventData>> {
    try {
        const validatedData = await eventCreateSchema.validate(payload, {
            abortEarly: false,
        });

        const res = await axiosServer.post<EventItemBackendResponse>(
            API_ENDPOINT,
            payload,
        );
        const backendResponse = res.data;

        return {
            success: true,
            data: backendResponse.event,
            message: backendResponse.message,
        };
    } catch (error) {
        return handleServerError(error, 'Failed to create event');
    }
}

export async function updateEvent(
    id: string,
    payload: EventUpdateInput,
): Promise<ApiResponse<EventData>> {
    try {
        await eventIdParamsSchema.validate({ id });
        const validatedData = await eventUpdateSchema.validate(payload, {
            abortEarly: false,
        });

        const res = await axiosServer.put<EventItemBackendResponse>(
            `${API_ENDPOINT}/${id}`,
            validatedData,
        );

        const backendResponse = res.data;

        return {
            success: true,
            data: backendResponse.event,
            message: backendResponse.message,
        };
    } catch (error) {
        return handleServerError(error, 'Failed to update event');
    }
}

export async function softDeleteEvent(
    id: string,
): Promise<ApiResponse<EventData>> {
    try {
        await eventIdParamsSchema.validate({ id });

        const res = await axiosServer.delete(`${API_ENDPOINT}/${id}/soft`);
        const backendResponse = res.data;

        return {
            success: true,
            data: backendResponse.event,
            message: backendResponse.message,
        };
    } catch (error) {
        return handleServerError(error, 'Failed to remove event');
    }
}

export async function hardDeleteEvent(
    id: string,
): Promise<ApiResponse<EventData>> {
    try {
        await eventIdParamsSchema.validate({ id });

        const res = await axiosServer.delete(`${API_ENDPOINT}/${id}/hard`);
        const backendResponse = res.data;

        return {
            success: true,
            data: backendResponse.event,
            message: backendResponse.message,
        };
    } catch (error) {
        return handleServerError(error, 'Failed to permanently remove event');
    }
}

export async function restoreEvent(
    id: string,
): Promise<ApiResponse<EventData>> {
    try {
        await eventIdParamsSchema.validate({ id });

        const res = await axiosServer.put<EventItemBackendResponse>(
            `${API_ENDPOINT}/${id}/restore`,
        );

        const backendResponse = res.data;

        return {
            success: true,
            data: backendResponse.event,
            message: backendResponse.message,
        };
    } catch (error) {
        return handleServerError(error, 'Failed to restore event');
    }
}
