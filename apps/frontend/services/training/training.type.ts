import * as yup from 'yup';
import { FileMediaRefDto, NamedCatalogResponseDto } from '@rl/types';
import {
  trainingCreateSchema,
  trainingFormSchema,
  trainingIdParamsSchema,
  trainingUpdateSchema,
} from './training.validation';
import { CursorPagination } from '@/types/api';

// TypeScript types
export type TrainingFormValues = yup.InferType<typeof trainingFormSchema>;
export type TrainingCreateInput = yup.InferType<typeof trainingCreateSchema>;
export type TrainingUpdateInput = yup.InferType<typeof trainingUpdateSchema>;
export type TrainingIdParams = yup.InferType<typeof trainingIdParamsSchema>;

export type TrainingListFilters = {
  cursor?: string;
  limit?: number;
  jobProfileId?: string;
};

// API Response types
export type TrainingData = {
  _id: string;
  jobProfileId: string;
  userId: string;
  organizationName: string;
  courseName: string;
  // Skill catalogue entries, in the order picked.
  skills: NamedCatalogResponseDto[];
  isCurrentlyEnrolled: boolean;
  startDate: string;
  // Null while the candidate is still enrolled.
  endDate?: string | null;
  certificateId?: string | null;
  // The uploaded certificate, with its public `src` URL.
  certificate?: FileMediaRefDto | null;
  createdAt: string;
  updatedAt: string;
};

export type TrainingListBackendResponse = {
  success: boolean;
  trainings: TrainingData[];
  pagination: CursorPagination;
  message?: string;
};

export type TrainingItemBackendResponse = {
  success: boolean;
  training: TrainingData;
  message?: string;
};

export type TrainingListResponse = {
  docs: TrainingData[];
  pagination: CursorPagination;
};

/**
 * Short-lived signed links to a training's certificate and its preview image.
 * `thumbnailUrl` is null until the preview has been generated.
 */
export type TrainingCertificateUrls = {
  url: string;
  thumbnailUrl: string | null;
};

export type TrainingCertificateUrlsBackendResponse = {
  success: boolean;
  certificate: TrainingCertificateUrls;
  message?: string;
};
