'use server';
import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';
import {
    CertificationData,
    CertificationListResponse,
    CertificationCreateInput,
    CertificationUpdateInput,
    CertificationListBackendResponse,
    CertificationItemBackendResponse,
    CertificationListFilters,
} from './certification.type';
import {
    certificationCreateSchema,
    certificationIdParamsSchema,
    certificationItemResponseSchema,
    certificationListResponseSchema,
    certificationUpdateSchema
} from './certification.validation';
import { ApiResponse } from '@/types/api';

const API_ENDPOINT = '/certifications';

export async function getCertifications(
    params?: CertificationListFilters,
): Promise<ApiResponse<CertificationListResponse>> {
    try {
        const res = await axiosServer.get<CertificationListBackendResponse>(
            API_ENDPOINT,
            {
                params: {
                    page: params?.page || 1,
                    limit: params?.limit || 10,
                },
            },
        );
        const backendResponse = await certificationListResponseSchema.validate(res.data, {
            stripUnknown: true,
        });

        return {
            success: true,
            data: {
                docs: backendResponse.certifications || [],
                pagination: backendResponse.pagination,
            },
            message: backendResponse.message,
        };
    } catch (error) {
        return handleServerError(error, 'Failed to fetch certifications');
    }
}

export async function getCertificationById(
    id: string,
): Promise<ApiResponse<CertificationData>> {
    try {
        await certificationIdParamsSchema.validate({ id });

        const res =
            await axiosServer.get<CertificationItemBackendResponse>(`${API_ENDPOINT}/${id}`);

        const backendResponse = await certificationItemResponseSchema.validate(res.data, {
            stripUnknown: true,
        });

        return {
            success: true,
            data: backendResponse.certification,
            message: backendResponse.message,
        };
    } catch (error) {
        return handleServerError(error, 'Failed to fetch certification');
    }
}

export async function createCertification(
    payload: CertificationCreateInput,
): Promise<ApiResponse<CertificationData>> {
    try {
        const validatedData = await certificationCreateSchema.validate(payload, {
            abortEarly: false,
        });

        const res = await axiosServer.post<CertificationItemBackendResponse>(
            API_ENDPOINT,
            validatedData,
        );
        const backendResponse = res.data;

        return {
            success: true,
            data: backendResponse.certification,
            message: backendResponse.message,
        };
    } catch (error) {
        return handleServerError(error, 'Failed to create certification');
    }
}

export async function updateCertification(
    id: string,
    payload: CertificationUpdateInput,
): Promise<ApiResponse<CertificationData>> {
    try {
        await certificationIdParamsSchema.validate({ id });
        const validatedData = await certificationUpdateSchema.validate(payload, {
            abortEarly: false,
        });

        const res = await axiosServer.put<CertificationItemBackendResponse>(
            `${API_ENDPOINT}/${id}`,
            validatedData,
        );

        const backendResponse = res.data;

        return {
            success: true,
            data: backendResponse.certification,
            message: backendResponse.message,
        };
    } catch (error) {
        return handleServerError(error, 'Failed to update certification');
    }
}

export async function softDeleteCertification(
    id: string,
): Promise<ApiResponse<CertificationData>> {
    try {
        await certificationIdParamsSchema.validate({ id });

        const res = await axiosServer.delete(`${API_ENDPOINT}/${id}/soft`);
        const backendResponse = res.data;

        return {
            success: true,
            data: backendResponse.certification,
            message: backendResponse.message,
        };
    } catch (error) {
        return handleServerError(error, 'Failed to remove certification');
    }
}

export async function hardDeleteCertification(
    id: string,
): Promise<ApiResponse<CertificationData>> {
    try {
        await certificationIdParamsSchema.validate({ id });

        const res = await axiosServer.delete(`${API_ENDPOINT}/${id}/hard`);
        const backendResponse = res.data;

        return {
            success: true,
            data: backendResponse.certification,
            message: backendResponse.message,
        };
    } catch (error) {
        return handleServerError(error, 'Failed to permanently remove certification');
    }
}

export async function restoreCertification(
    id: string,
): Promise<ApiResponse<CertificationData>> {
    try {
        await certificationIdParamsSchema.validate({ id });

        const res = await axiosServer.put<CertificationItemBackendResponse>(
            `${API_ENDPOINT}/${id}/restore`,
        );

        const backendResponse = res.data;

        return {
            success: true,
            data: backendResponse.certification,
            message: backendResponse.message,
        };
    } catch (error) {
        return handleServerError(error, 'Failed to restore certification');
    }
}
