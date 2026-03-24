import * as yup from 'yup';
import {
  postCreateSchema,
  postIdParamsSchema,
  postUpdateSchema,
} from './post.validation';
import { Pagination } from '@/types/api';

// TypeScript types
export type PostCreateInput = yup.InferType<typeof postCreateSchema>;
export type PostUpdateInput = yup.InferType<typeof postUpdateSchema>;
export type PostIdParams = yup.InferType<typeof postIdParamsSchema>;

export type PostListFilters = {
  page?: number;
  limit?: number;
  search?: string;
  statusId?: string;
};

// API Response types
export type PostData = {
  _id: string;
  userId: string;
  title: string;
  content: string;
  imageIds?: string[];
  tags?: string[];
  statusId: string;
  deleteMarker?: {
    status: boolean;
    deletedAt?: string | null;
    dateScheduled?: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type PostListBackendResponse = {
  success: boolean;
  posts: PostData[];
  pagination: Pagination;
  message?: string;
};

export type PostItemBackendResponse = {
  success: boolean;
  post: PostData;
  message?: string;
};

export type PostListResponse = {
  docs: PostData[];
  pagination: Pagination;
};
