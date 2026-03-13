'use server';
import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';
import {
	ExperienceData,
	ExperienceListResponse,
	ExperienceCreateInput,
	ExperienceUpdateInput,
	ExperienceListBackendResponse,
	ExperienceItemBackendResponse,
	ExperienceListFilters,
} from './experience.type';
import { experienceCreateSchema, experienceIdParamsSchema, experienceItemResponseSchema, experienceListResponseSchema, experienceUpdateSchema } from './experience.validation';
import { ApiResponse } from '@/types/api';

const API_ENDPOINT = '/experiences';

export async function getExperiences(
	params?: ExperienceListFilters,
): Promise<ApiResponse<ExperienceListResponse>> {
	try {
		const res = await axiosServer.get<ExperienceListBackendResponse>(
			API_ENDPOINT,
			{
				params: {
					page: params?.page || 1,
					limit: params?.limit || 10,
					search: params?.search,
				},
			},
		);
		const backendResponse = await experienceListResponseSchema.validate(res.data, {
			stripUnknown: true,
		});

		return {
			success: true,
			data: {
				docs: backendResponse.experiences || [],
				pagination: backendResponse.pagination,
			},
			message: backendResponse.message,
		};
	} catch (error) {
		return handleServerError(error, 'Failed to fetch experiences');
	}
}

export async function getExperienceById(
	id: string,
): Promise<ApiResponse<ExperienceData>> {
	try {
		await experienceIdParamsSchema.validate({ id });

		const res =
			await axiosServer.get<ExperienceItemBackendResponse>(`${API_ENDPOINT}/${id}`);

		const backendResponse = await experienceItemResponseSchema.validate(res.data, {
			stripUnknown: true,
		});

		return {
			success: true,
			data: backendResponse.experience,
			message: backendResponse.message,
		};
	} catch (error) {
		return handleServerError(error, 'Failed to fetch experience');
	}
}

export async function createExperience(
	payload: ExperienceCreateInput,
): Promise<ApiResponse<ExperienceData>> {
	try {
		const validatedData = await experienceCreateSchema.validate(payload, {
			abortEarly: false,
		});

		const res = await axiosServer.post<ExperienceItemBackendResponse>(
			API_ENDPOINT,
			validatedData,
		);
		const backendResponse = res.data;

		return {
			success: true,
			data: backendResponse.experience,
			message: backendResponse.message,
		};
	} catch (error) {
		return handleServerError(error, 'Failed to create experience');
	}
}

export async function updateExperience(
	id: string,
	payload: ExperienceUpdateInput,
): Promise<ApiResponse<ExperienceData>> {
	try {
		await experienceIdParamsSchema.validate({ id });
		const validatedData = await experienceUpdateSchema.validate(payload, {
			abortEarly: false,
		});

		const res = await axiosServer.put<ExperienceItemBackendResponse>(
			`${API_ENDPOINT}/${id}`,
			validatedData,
		);

		const backendResponse = res.data;

		return {
			success: true,
			data: backendResponse.experience,
			message: backendResponse.message,
		};
	} catch (error) {
		return handleServerError(error, 'Failed to update experience');
	}
}

export async function softDeleteExperience(
	id: string,
): Promise<ApiResponse<ExperienceData>> {
	try {
		await experienceIdParamsSchema.validate({ id });

		const res = await axiosServer.delete(`${API_ENDPOINT}/${id}/soft`);
		const backendResponse = res.data;

		return {
			success: true,
			data: backendResponse.experience,
			message: backendResponse.message,
		};
	} catch (error) {
		return handleServerError(error, 'Failed to remove experience');
	}
}

export async function hardDeleteExperience(
	id: string,
): Promise<ApiResponse<ExperienceData>> {
	try {
		await experienceIdParamsSchema.validate({ id });

		const res = await axiosServer.delete(`${API_ENDPOINT}/${id}/hard`);
		const backendResponse = res.data;

		return {
			success: true,
			data: backendResponse.experience,
			message: backendResponse.message,
		};
	} catch (error) {
		return handleServerError(error, 'Failed to permanently remove experience');
	}
}

export async function restoreExperience(
	id: string,
): Promise<ApiResponse<ExperienceData>> {
	try {
		await experienceIdParamsSchema.validate({ id });

		const res = await axiosServer.put<ExperienceItemBackendResponse>(
			`${API_ENDPOINT}/${id}/restore`,
		);

		const backendResponse = res.data;

		return {
			success: true,
			data: backendResponse.experience,
			message: backendResponse.message,
		};
	} catch (error) {
		return handleServerError(error, 'Failed to restore experience');
	}
}
