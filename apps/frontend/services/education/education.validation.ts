import * as yup from 'yup';

// Yup schemas for validation
export const educationCreateSchema = yup.object({
    jobProfileId: yup.string().required('Job Profile ID is required'),
    institution: yup.string().required('Institution is required'),
    degree: yup.string().required('Degree is required'),
    fieldOfStudy: yup.string().optional(),
    startDate: yup.string().optional(),
    endDate: yup.string().optional(),
    grade: yup.string().optional(),
    description: yup.string().optional(),
});

export const educationUpdateSchema = yup.object({
    institution: yup.string().optional(),
    degree: yup.string().optional(),
    fieldOfStudy: yup.string().optional(),
    startDate: yup.string().optional(),
    endDate: yup.string().optional(),
    grade: yup.string().optional(),
    description: yup.string().optional(),
});

export const educationIdParamsSchema = yup.object({
    id: yup.string().required('ID is required'),
});

export const deleteMarkerSchema = yup.object({
    status: yup.boolean().required(),
    deletedAt: yup.string().nullable().default(null),
    dateScheduled: yup.string().nullable().default(null),
});

export const educationSchema = yup.object({
    _id: yup.string().required('ID is required'),
    jobProfileId: yup.string().required('Job Profile ID is required'),
    userId: yup.string().required('User ID is required'),
    institution: yup.string().required('Institution is required'),
    degree: yup.string().required('Degree is required'),
    fieldOfStudy: yup.string().optional(),
    startDate: yup.string().optional(),
    endDate: yup.string().optional(),
    grade: yup.string().optional(),
    description: yup.string().optional(),
    createdAt: yup.string().required(),
    updatedAt: yup.string().required(),
    deletedAt: yup.string().optional(),
});

export const paginationSchema = yup.object({
    totalDocs: yup.number().required(),
    limit: yup.number().required(),
    totalPages: yup.number().required(),
    page: yup.number().required(),
    pagingCounter: yup.number().required(),
    hasPrevPage: yup.boolean().required(),
    hasNextPage: yup.boolean().required(),
    prevPage: yup.number().nullable().defined(),
    nextPage: yup.number().nullable().defined(),
    total: yup.number().optional(),
});

export const educationListResponseSchema = yup.object({
    educations: yup.array().of(educationSchema).required(),
    pagination: paginationSchema.required(),
    message: yup.string().optional(),
});

export const educationItemResponseSchema = yup.object({
    education: educationSchema.required(),
    message: yup.string().optional(),
});