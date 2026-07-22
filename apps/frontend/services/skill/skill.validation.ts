import * as yup from 'yup';
import { paginationSchema } from '../shared';

// Yup schemas for validation
export const skillCreateSchema = yup.object({
    jobProfileId: yup.string().required('Job Profile ID is required'),
    name: yup.string().min(2).max(50).required('Name is required'),
    proficiencyLevel: yup.string().optional(),
    description: yup.string().max(500).optional(),
});

export const skillUpdateSchema = yup.object({
    name: yup.string().min(2).max(50).optional(),
    proficiencyLevel: yup.string().optional(),
    description: yup.string().max(500).optional(),
});

export const skillIdParamsSchema = yup.object({
    id: yup.string().required('ID is required'),
});

export const deleteMarkerSchema = yup.object({
    status: yup.boolean().required(),
    deletedAt: yup.string().nullable().default(null),
    dateScheduled: yup.string().nullable().default(null),
});

export const skillSchema = yup.object({
    _id: yup.string().required('ID is required'),
    jobProfileId: yup.string().required('Job Profile ID is required'),
    userId: yup.string().required('User ID is required'),
    name: yup.string().required('Name is required'),
    proficiencyLevel: yup.string().optional(),
    description: yup.string().optional(),
    deleteMarker: deleteMarkerSchema.optional(),
    createdAt: yup.string().optional(),
    updatedAt: yup.string().optional(),
});


export const skillListResponseSchema = yup.object({
    skills: yup.array().of(skillSchema).required(),
    pagination: paginationSchema.required(),
    message: yup.string().optional(),
});

export const skillItemResponseSchema = yup.object({
    skill: skillSchema.required(),
    message: yup.string().optional(),
});
