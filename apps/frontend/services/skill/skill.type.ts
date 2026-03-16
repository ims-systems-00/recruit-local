import * as yup from 'yup';
import { skillCreateSchema, skillIdParamsSchema, skillUpdateSchema } from "./skill.validation";
import { Pagination } from '@/types/api';

// TypeScript types
export type SkillCreateInput = yup.InferType<typeof skillCreateSchema>;
export type SkillUpdateInput = yup.InferType<typeof skillUpdateSchema>;
export type SkillIdParams = yup.InferType<typeof skillIdParamsSchema>;

export type SkillListFilters = {
    page?: number;
    limit?: number;
    search?: string;
};

// API Response types
export type SkillData = {
    _id: string;
    jobProfileId: string;
    userId: string;
    name: string;
    proficiencyLevel?: string;
    description?: string;
    deleteMarker?: {
        status: boolean;
        deletedAt: string | null;
        dateScheduled: string | null;
    };
    createdAt?: string;
    updatedAt?: string;
};


export type SkillListBackendResponse = {
    success: boolean;
    skills: SkillData[];
    pagination: Pagination;
    message?: string;
};

export type SkillItemBackendResponse = {
    success: boolean;
    skill: SkillData;
    message?: string;
};

export type SkillListResponse = {
    docs: SkillData[];
    pagination: Pagination;
};
