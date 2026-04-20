import * as yup from 'yup';
import { CV_STATUS_ENUM } from '@rl/types';
import { objectIdSchema, deleteMarkerSchema, paginationSchema } from '../shared';

const awsStorageSchema = yup.object({
    Name: yup.string().required('Name is required'),
    Bucket: yup.string().required('Bucket is required'),
    Key: yup.string().required('Key is required'),
}).nullable().default(undefined);


const skillInputSchema = yup.object({
    _id: objectIdSchema.optional(),
    name: yup.string().required('Skill name is required'),
    proficiencyLevel: yup.string().nullable().optional(),
    description: yup.string().nullable().optional(),
});

const educationInputSchema = yup.object({
    _id: objectIdSchema.optional(),
    institution: yup.string().required('Institution is required'),
    degree: yup.string().required('Degree is required'),
    fieldOfStudy: yup.string().required('Field of study is required'),
    startDate: yup.string().required('Start date is required'),
    endDate: yup.string().nullable().optional(),
    description: yup.string().nullable().optional(),
    grade: yup.string().nullable().optional(),
});

const experienceInputSchema = yup.object({
    _id: objectIdSchema.optional(),
    company: yup.string().required('Company is required'),
    location: yup.string().nullable().optional(),
    workplace: yup.string().nullable().optional(),
    employmentType: yup.string().nullable().optional(),
    jobTitle: yup.string().required('Job title is required'),
    startDate: yup.string().required('Start date is required'),
    endDate: yup.string().nullable().optional(),
    description: yup.string().nullable().optional(),
    isActive: yup.boolean().optional(),
});

const interestInputSchema = yup.object({
    _id: objectIdSchema.optional(),
    name: yup.string().required('Interest name is required'),
    description: yup.string().nullable().optional(),
});


// ==========================================
// 2. OUTPUT SUB-SCHEMAS (For DB Responses)
// Extends inputs but forces _id to be required
// ==========================================
const skillSchema = skillInputSchema.shape({ _id: objectIdSchema.required() });
const educationSchema = educationInputSchema.shape({ _id: objectIdSchema.required() });
const experienceSchema = experienceInputSchema.shape({ _id: objectIdSchema.required() });
const interestSchema = interestInputSchema.shape({ _id: objectIdSchema.required() });


// ==========================================
// 3. CORE DATA MODEL (Matches Backend Output)
// ==========================================
export const cvSchema = yup.object({
    _id: objectIdSchema.required(),
    title: yup.string().required(),
    summary: yup.string().nullable().optional(),

    // Uses the strict OUTPUT schemas
    experience: yup.array().of(experienceSchema).default([]),
    education: yup.array().of(educationSchema).default([]),
    skills: yup.array().of(skillSchema).default([]),
    interests: yup.array().of(interestSchema).default([]),

    // Base details
    name: yup.string().nullable().optional(),
    imageId: objectIdSchema.nullable().optional(),
    email: yup.string().email().nullable().optional(),
    phone: yup.string().nullable().optional(),
    address: yup.string().nullable().optional(),

    // Settings & Status
    templateId: yup.string().nullable().optional(),
    colorProfile: yup.string().nullable().optional(),
    statusId: objectIdSchema.nullable().optional(),
    status: yup.string().optional(),

    // System Fields
    deleteMarker: deleteMarkerSchema.required(),
    userId: objectIdSchema.required(),
    jobProfileId: objectIdSchema.required(),
    createdAt: yup.string().required(),
    updatedAt: yup.string().required(),
    __v: yup.number().optional(),
});


// ==========================================
// 4. MUTATION SCHEMAS (Create & Update)
// ==========================================
export const idParamsSchema = yup.object({
    id: objectIdSchema.required('CV ID is required'),
});

export const createCvSchema = yup.object({
    title: yup.string().required('CV Title is required').default('Untitled CV'),
    jobProfileId: objectIdSchema.required('Job Profile ID is required'),
    summary: yup.string().optional(),
    name: yup.string().optional(),
    email: yup.string().email('Invalid email').optional(),
    phone: yup.string().optional(),
    address: yup.string().optional(),
    imageStorage: awsStorageSchema.optional(),

    // Uses the flexible INPUT schemas
    experience: yup.array().of(experienceInputSchema).optional(),
    education: yup.array().of(educationInputSchema).optional(),
    skills: yup.array().of(skillInputSchema).optional(),
    interests: yup.array().of(interestInputSchema).optional(),

    templateId: yup.string().optional(),
    colorProfile: yup.string().optional(),
    statusId: objectIdSchema.optional(),
});

export const updateCvSchema = yup.object({
    title: yup.string().optional(),
    jobProfileId: objectIdSchema.optional(),
    summary: yup.string().optional(),
    name: yup.string().optional(),
    email: yup.string().email('Invalid email').optional(),
    phone: yup.string().optional(),
    address: yup.string().optional(),
    imageStorage: awsStorageSchema.optional(),

    // Uses the flexible INPUT schemas
    experience: yup.array().of(experienceInputSchema).optional(),
    education: yup.array().of(educationInputSchema).optional(),
    skills: yup.array().of(skillInputSchema).optional(),
    interests: yup.array().of(interestInputSchema).optional(),

    templateId: yup.string().optional(),
    colorProfile: yup.string().optional(),
    statusId: yup.mixed<CV_STATUS_ENUM>().oneOf(Object.values(CV_STATUS_ENUM)).optional(),
});


// ==========================================
// 5. BACKEND RESPONSE ENVELOPES
// ==========================================
export const cvListResponseSchema = yup.object({
    message: yup.string().required(),
    statusCode: yup.number().required(),
    cvs: yup.array().of(cvSchema).required(),
    pagination: paginationSchema.required(),
});

export const cvItemResponseSchema = yup.object({
    cv: cvSchema.required(),
    message: yup.string().optional(),
    statusCode: yup.number().optional(),
});

export const cvActionResponseSchema = yup.object({
    message: yup.string().optional(),
    statusCode: yup.number().optional(),
});