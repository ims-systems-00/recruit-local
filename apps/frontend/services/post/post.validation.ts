import * as yup from 'yup';
import { paginationSchema } from '../shared';

// Reusable schema for AWS storage
export const awsStorageSchema = yup
  .object({
    Name: yup.string().required('Name is required'),
    Bucket: yup.string().required('Bucket is required'),
    Key: yup.string().required('Key is required'),
  })
  .label('Storage File');

// Yup schemas for validation
export const postCreateSchema = yup.object({
  title: yup.string().required('Title is required'),
  content: yup.string().required('Content is required'),
  imagesStorage: yup.array().of(awsStorageSchema).optional(),
  tags: yup.array().of(yup.string().defined()).optional(),
  statusId: yup.string().required('Status ID is required'),
});

export const postUpdateSchema = yup.object({
  title: yup.string().optional(),
  content: yup.string().optional(),
  imagesStorage: yup.array().of(awsStorageSchema).optional(),
  tags: yup.array().of(yup.string().defined()).optional(),
  statusId: yup.string().optional(),
});

export const postIdParamsSchema = yup.object({
  id: yup.string().required('ID is required'),
});

export const deleteMarkerSchema = yup.object({
  status: yup.boolean().required(),
  deletedAt: yup.string().nullable().optional(),
  dateScheduled: yup.string().nullable().optional(),
});

export const postSchema = yup.object({
  _id: yup.string().required('ID is required'),
  userId: yup.string().required('User ID is required'),
  title: yup.string().required('Title is required'),
  content: yup.string().required('Content is required'),
  imageIds: yup.array().of(yup.string().defined()).optional(),
  tags: yup.array().of(yup.string().defined()).optional(),
  statusId: yup.string().required('Status ID is required'),
  deleteMarker: deleteMarkerSchema.optional(),
  createdAt: yup.string().optional(),
  updatedAt: yup.string().optional(),
  deletedAt: yup.string().nullable().optional(),
});

export const postListResponseSchema = yup.object({
  posts: yup.array().of(postSchema).required(),
  pagination: paginationSchema.required(),
  message: yup.string().optional(),
});

export const postItemResponseSchema = yup.object({
  post: postSchema.required(),
  message: yup.string().optional(),
});
