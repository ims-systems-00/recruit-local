import * as yup from 'yup';
import { certificationCreateSchema, certificationIdParamsSchema, certificationUpdateSchema } from "./certification.validation";
import { Pagination } from '@/types/api';

// TypeScript types
export type CertificationCreateInput = yup.InferType<typeof certificationCreateSchema>;
export type CertificationUpdateInput = yup.InferType<typeof certificationUpdateSchema>;
export type CertificationIdParams = yup.InferType<typeof certificationIdParamsSchema>;

export type CertificationListFilters = {
    page?: number;
    limit?: number;
    search?: string;
};

// API Response types
export type CertificationData = {
    _id: string;
    jobProfileId: string;
    userId: string;
    title: string;
    issuingOrganization: string;
    issueDate: string;
    imageId?: string | null;
    deleteMarker?: {
        status: boolean;
        deletedAt?: string | null;
        dateScheduled?: string | null;
    };
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
};



export type CertificationListBackendResponse = {
    success: boolean;
    certifications: CertificationData[];
    pagination: Pagination;
    message?: string;
};

export type CertificationItemBackendResponse = {
    success: boolean;
    certification: CertificationData;
    message?: string;
};

export type CertificationListResponse = {
    docs: CertificationData[];
    pagination: Pagination;
};
