'use server';
import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';
import {
    SkillData,
    SkillListResponse,
    SkillCreateInput,
    SkillUpdateInput,
    SkillListBackendResponse,
    SkillItemBackendResponse,
    SkillListFilters,
} from './skill.type';
import { ApiResponse } from '@/types/api';
import {
    skillCreateSchema,
    skillIdParamsSchema,
    skillItemResponseSchema,
    skillListResponseSchema,
    skillUpdateSchema
} from './skill.validation';

const API_ENDPOINT = '/skills';

export async function getSkills(
    params?: SkillListFilters,
): Promise<ApiResponse<SkillListResponse>> {
    try {
        const res = await axiosServer.get<SkillListBackendResponse>(
            API_ENDPOINT,
            {
                params: {
                    page: params?.page || 1,
                    limit: params?.limit || 10,
                },
            },
        );

        const backendResponse = await skillListResponseSchema.validate(res.data, {
            stripUnknown: true,
        });

        return {
            success: true,
            data: {
                docs: backendResponse.skills || [],
                pagination: backendResponse.pagination,
            },
            message: backendResponse.message,
        };
    } catch (error) {
        return handleServerError(error, 'Failed to fetch skills');
    }
}

export async function getSkillById(
    id: string,
): Promise<ApiResponse<SkillData>> {
    try {
        await skillIdParamsSchema.validate({ id });

        const res =
            await axiosServer.get<SkillItemBackendResponse>(`${API_ENDPOINT}/${id}`);

        const backendResponse = await skillItemResponseSchema.validate(res.data, {
            stripUnknown: true,
        });

        return {
            success: true,
            data: backendResponse.skill,
            message: backendResponse.message,
        };
    } catch (error) {
        return handleServerError(error, 'Failed to fetch skill');
    }
}

export async function createSkill(
    payload: SkillCreateInput,
): Promise<ApiResponse<SkillData>> {
    try {
        const validatedData = await skillCreateSchema.validate(payload, {
            abortEarly: false,
        });

        const res = await axiosServer.post<SkillItemBackendResponse>(
            API_ENDPOINT,
            validatedData,
        );
        const backendResponse = res.data;

        return {
            success: true,
            data: backendResponse.skill,
            message: backendResponse.message,
        };
    } catch (error) {
        return handleServerError(error, 'Failed to create skill');
    }
}

export async function updateSkill(
    id: string,
    payload: SkillUpdateInput,
): Promise<ApiResponse<SkillData>> {
    try {
        await skillIdParamsSchema.validate({ id });
        const validatedData = await skillUpdateSchema.validate(payload, {
            abortEarly: false,
        });

        const res = await axiosServer.put<SkillItemBackendResponse>(
            `${API_ENDPOINT}/${id}`,
            validatedData,
        );

        const backendResponse = res.data;

        return {
            success: true,
            data: backendResponse.skill,
            message: backendResponse.message,
        };
    } catch (error) {
        return handleServerError(error, 'Failed to update skill');
    }
}

export async function softDeleteSkill(
    id: string,
): Promise<ApiResponse<SkillData>> {
    try {
        // Validate ID
        await skillIdParamsSchema.validate({ id });

        const res = await axiosServer.delete(`${API_ENDPOINT}/${id}/soft`);
        const backendResponse = res.data;

        return {
            success: true,
            data: backendResponse.skill,
            message: backendResponse.message,
        };
    } catch (error) {
        return handleServerError(error, 'Failed to remove skill');
    }
}

export async function hardDeleteSkill(
    id: string,
): Promise<ApiResponse<SkillData>> {
    try {
        // Validate ID
        await skillIdParamsSchema.validate({ id });

        const res = await axiosServer.delete(`${API_ENDPOINT}/${id}/hard`);
        const backendResponse = res.data;

        return {
            success: true,
            data: backendResponse.skill,
            message: backendResponse.message,
        };
    } catch (error) {
        return handleServerError(error, 'Failed to permanently remove skill');
    }
}

export async function restoreSkill(
    id: string,
): Promise<ApiResponse<SkillData>> {
    try {
        await skillIdParamsSchema.validate({ id });

        const res = await axiosServer.put<SkillItemBackendResponse>(
            `${API_ENDPOINT}/${id}/restore`,
        );

        const backendResponse = res.data;

        return {
            success: true,
            data: backendResponse.skill,
            message: backendResponse.message,
        };
    } catch (error) {
        return handleServerError(error, 'Failed to restore skill');
    }
}
