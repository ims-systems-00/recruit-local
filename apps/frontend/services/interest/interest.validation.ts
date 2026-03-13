import * as yup from 'yup';
import { paginationSchema } from '../shared';

// Yup schemas for validation
export const interestCreateSchema = yup.object({
    jobProfileId: yup.string().required('Job Profile ID is required'),
    name: yup.string().min(2).max(50).required('Name is required'),
    description: yup.string().max(500).optional(),
});

export const interestUpdateSchema = yup.object({
    name: yup.string().min(2).max(50).optional(),
    description: yup.string().max(500).optional(),
});

export const interestIdParamsSchema = yup.object({
    id: yup.string().required('ID is required'),
});

export const interestSchema = yup.object({
    _id: yup.string().required('ID is required'),
    jobProfileId: yup.string().required('Job Profile ID is required'),
    userId: yup.string().required('User ID is required'),
    name: yup.string().required('Name is required'),
    description: yup.string().optional(),
    createdAt: yup.string().required(),
    updatedAt: yup.string().required(),
    deletedAt: yup.string().optional(),
});

export const interestListResponseSchema = yup.object({
    interests: yup.array().of(interestSchema).required(),
    pagination: paginationSchema.required(),
    message: yup.string().optional(),
});

export const interestItemResponseSchema = yup.object({
    interest: interestSchema.required(),
    message: yup.string().optional(),
});
