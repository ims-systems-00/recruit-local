'use server';
import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';
import {
	ExperienceApiResponse,
	ExperienceData,
	ExperienceListResponse,
	ExperienceCreateInput,
	ExperienceUpdateInput,
	experienceCreateSchema,
	experienceUpdateSchema,
	experienceIdParamsSchema,
	ExperienceListBackendResponse,
	ExperienceItemBackendResponse,
	ExperienceListFilters,
} from './experience.type';

export async function getExperiences(
	params?: ExperienceListFilters,
): Promise<ExperienceApiResponse<ExperienceListResponse>> {
	try {
		const res = await axiosServer.get<ExperienceListBackendResponse>(
			'/experiences',
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
): Promise<ExperienceApiResponse<ExperienceData>> {
	try {
		await experienceIdParamsSchema.validate({ id });

		const res =
			await axiosServer.get<ExperienceItemBackendResponse>(`/experiences/${id}`);

		const backendResponse = res.data;

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
): Promise<ExperienceApiResponse<ExperienceData>> {
	try {
		const validatedData = await experienceCreateSchema.validate(payload, {
			abortEarly: false,
		});

		const res = await axiosServer.post<ExperienceItemBackendResponse>(
			'/experiences',
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
): Promise<ExperienceApiResponse<ExperienceData>> {
	try {
		await experienceIdParamsSchema.validate({ id });
		const validatedData = await experienceUpdateSchema.validate(payload, {
			abortEarly: false,
		});

		const res = await axiosServer.put<ExperienceItemBackendResponse>(
			`/experiences/${id}`,
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
): Promise<ExperienceApiResponse<void>> {
	try {
		await experienceIdParamsSchema.validate({ id });

		const res = await axiosServer.delete(`/experiences/${id}/soft`);
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
): Promise<ExperienceApiResponse<void>> {
	try {
		await experienceIdParamsSchema.validate({ id });

		const res = await axiosServer.delete(`/experiences/${id}/hard`);
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
): Promise<ExperienceApiResponse<ExperienceData>> {
	try {
		await experienceIdParamsSchema.validate({ id });

		const res = await axiosServer.put<ExperienceItemBackendResponse>(
			`/experiences/${id}/restore`,
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
