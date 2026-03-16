import * as yup from 'yup';
import { paginationSchema } from '../shared';

const awsStorageSchema = yup.object({
    Name: yup.string().required('File Name is required'),
    Bucket: yup.string().required('Bucket is required'),
    Key: yup.string().required('Key is required'),
});

// Yup schemas for validation
export const certificationCreateSchema = yup.object({
    jobProfileId: yup.string().required('Job Profile ID is required'),
    title: yup.string().required('Title is required'),
    issuingOrganization: yup.string().required('Issuing Organization is required'),
    issueDate: yup.string().required('Issue Date is required'),
    imageStorage: awsStorageSchema.optional(),
});

export const certificationUpdateSchema = yup.object({
    title: yup.string().optional(),
    issuingOrganization: yup.string().optional(),
    issueDate: yup.string().optional(),
    imageStorage: awsStorageSchema.optional(),
});

export const certificationIdParamsSchema = yup.object({
    id: yup.string().required('ID is required'),
});

export const deleteMarkerSchema = yup.object({
    status: yup.boolean().required(),
    deletedAt: yup.string().nullable().optional(),
    dateScheduled: yup.string().nullable().optional(),
});

export const certificationSchema = yup.object({
    _id: yup.string().required('ID is required'),
    jobProfileId: yup.string().required('Job Profile ID is required'),
    userId: yup.string().required('User ID is required'),
    title: yup.string().required('Title is required'),
    issuingOrganization: yup.string().required('Issuing Organization is required'),
    issueDate: yup.string().required('Issue Date is required'),
    imageId: yup.string().nullable().optional(),
    deleteMarker: deleteMarkerSchema.optional(),
    createdAt: yup.string().optional(),
    updatedAt: yup.string().optional(),
    deletedAt: yup.string().nullable().optional(),
});


export const certificationListResponseSchema = yup.object({
    certifications: yup.array().of(certificationSchema).required(),
    pagination: paginationSchema.required(),
    message: yup.string().optional(),
});

export const certificationItemResponseSchema = yup.object({
    certification: certificationSchema.required(),
    message: yup.string().optional(),
});
