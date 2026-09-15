import * as yup from 'yup';
import {
  postCreateSchema,
  postIdParamsSchema,
  postUpdateSchema,
} from './post.validation';
import { CursorPagination } from '@/types/api';

// TypeScript types
export type PostCreateInput = yup.InferType<typeof postCreateSchema>;
export type PostUpdateInput = yup.InferType<typeof postUpdateSchema>;
export type PostIdParams = yup.InferType<typeof postIdParamsSchema>;

export type PostListFilters = {
  cursor?: string;
  limit?: number;
  clientSearch?: string;
  statusId?: string;
  type?: string;
  matched?: boolean;
};

// API Response types

export interface PostImage {
  _id: string;
  storageInformation: PostStorageInformation;
  visibility: string;
  src: string;
}

export interface PostStorageInformation {
  Name: string;
  Key: string;
  Bucket: string;
}

export interface PostData {
  _id: string;
  text: string;
  type: string;
  title: string;
  images: PostImage[];
  banner: PostImage;
  status: string;
  tenantId: string;
  keywords: string[];
  createdAt: string;
  updatedAt: string;
  creator: Creator;
  alreadySaved?: boolean;
  alreadyReacted?: string | null;
  reactionCount: number;
  alreadySavedId?: string | null;
  alreadyReactedId?: string | null;
}

interface ProfileImage {
  _id: string;
  storageInformation: PostStorageInformation;
  visibility: 'public' | 'private';
  src: string;
}

export interface Creator {
  type: 'tenant';
  _id: string;
  name: string;
  description: string;
  industry: string;
  officeAddress: string;
  size: number;
  linkedIn: string;
  website: string;
  profileImage: ProfileImage;
}

export type PostListBackendResponse = {
  success: boolean;
  posts: PostData[];
  pagination: CursorPagination;
  message?: string;
};

export type PostItemBackendResponse = {
  success: boolean;
  post: PostData;
  message?: string;
};

export type PostListResponse = {
  docs: PostData[];
  pagination: CursorPagination;
};
