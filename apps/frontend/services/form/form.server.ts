'use server';

import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';
import {
  idParamsSchema,
  createFormSchema,
  updateFormSchema,
} from './form.validation';
import type {
  FormApiResponse,
  FormCreateInput,
  FormUpdateInput,
  FormListFilters,
} from './form.type';

const API_ENDPOINT = '/forms';

/** GET ALL FORMS */
export async function getForms(
  params?: FormListFilters,
): Promise<FormApiResponse> {
  try {
    const res = await axiosServer.get(API_ENDPOINT, {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 10,
        search: params?.search,
        collectionName: params?.collectionName,
        collectionId: params?.collectionId,
      },
    });
    return res.data;
  } catch (error) {
    return handleServerError(error, 'Failed to fetch Forms');
  }
}

/** GET SINGLE FORM */
export async function getFormById(id: string): Promise<FormApiResponse> {
  try {
    await idParamsSchema.validate({ id });
    const res = await axiosServer.get(`${API_ENDPOINT}/${id}`);
    return res.data;
  } catch (error) {
    return handleServerError(error, 'Failed to fetch Form details');
  }
}

/** CREATE FORM */
export async function createForm(
  payload: FormCreateInput,
): Promise<FormApiResponse> {
  try {
    const validatedPayload = await createFormSchema.validate(payload, {
      abortEarly: false,
    });
    const res = await axiosServer.post(API_ENDPOINT, validatedPayload);
    return res.data;
  } catch (error) {
    return handleServerError(error, 'Failed to create Form');
  }
}

/** UPDATE FORM */
export async function updateForm(
  id: string,
  payload: FormUpdateInput,
): Promise<FormApiResponse> {
  try {
    await idParamsSchema.validate({ id });
    const validatedPayload = await updateFormSchema.validate(payload, {
      abortEarly: false,
    });
    const res = await axiosServer.put(
      `${API_ENDPOINT}/${id}`,
      validatedPayload,
    );
    return res.data;
  } catch (error) {
    return handleServerError(error, 'Failed to update Form');
  }
}

/** SOFT DELETE FORM */
export async function softDeleteForm(id: string): Promise<FormApiResponse> {
  try {
    await idParamsSchema.validate({ id });
    const res = await axiosServer.delete(`${API_ENDPOINT}/${id}/soft`);
    return res.data;
  } catch (error) {
    return handleServerError(error, 'Failed to remove Form');
  }
}

/** RESTORE FORM */
export async function restoreForm(id: string): Promise<FormApiResponse> {
  try {
    await idParamsSchema.validate({ id });
    const res = await axiosServer.put(`${API_ENDPOINT}/${id}/restore`);
    return res.data;
  } catch (error) {
    return handleServerError(error, 'Failed to restore Form');
  }
}

/** HARD DELETE FORM */
export async function hardDeleteForm(id: string): Promise<FormApiResponse> {
  try {
    await idParamsSchema.validate({ id });
    const res = await axiosServer.delete(`${API_ENDPOINT}/${id}/hard`);
    return res.data;
  } catch (error) {
    return handleServerError(error, 'Failed to permanently delete Form');
  }
}
