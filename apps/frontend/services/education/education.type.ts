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

// TypeScript types
export type EducationCreateInput = yup.InferType<typeof educationCreateSchema>;
export type EducationUpdateInput = yup.InferType<typeof educationUpdateSchema>;
export type EducationIdParams = yup.InferType<typeof educationIdParamsSchema>;

// API Response types
export type EducationData = {
  _id: string;
  jobProfileId: string;
  userId: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate: string;
  endDate?: string;
  grade?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export type Pagination = {
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage?: number;
  nextPage?: number;
};

export type EducationListResponse = {
  docs: EducationData[];
  pagination: Pagination;
};

export type SuccessResponse<T = any> = {
  success: true;
  data: T;
  message?: string;
};

export type ErrorResponse = {
  success: false;
  message: string;
};

export type EducationApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;
