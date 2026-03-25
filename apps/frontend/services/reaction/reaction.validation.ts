import * as yup from 'yup';
import { ReactionType } from '@rl/types';
import { paginationSchema } from '../shared';

export const reactionCreateSchema = yup.object({
  collectionName: yup.string().required('Collection Name is required'),
  collectionId: yup.string().required('Collection ID is required'),
  type: yup
    .string()
    .oneOf(Object.values(ReactionType), 'Invalid reaction type')
    .required('Reaction Type is required'),
});

export const reactionUpdateSchema = yup.object({
  type: yup
    .string()
    .oneOf(Object.values(ReactionType), 'Invalid reaction type')
    .required('Reaction Type is required'),
});

export const reactionIdParamsSchema = yup.object({
  id: yup.string().required('ID is required'),
});

export const deleteMarkerSchema = yup.object({
  status: yup.boolean().required(),
  deletedAt: yup.string().nullable().optional(),
  dateScheduled: yup.string().nullable().optional(),
});

export const reactionSchema = yup.object({
  _id: yup.string().required('ID is required'),
  userId: yup.string().required('User ID is required'),
  collectionName: yup.string().required('Collection Name is required'),
  collectionId: yup.string().required('Collection ID is required'),
  type: yup
    .string()
    .oneOf(Object.values(ReactionType))
    .required('Reaction Type is required'),
  deleteMarker: deleteMarkerSchema.optional(),
  createdAt: yup.string().optional(),
  updatedAt: yup.string().optional(),
  deletedAt: yup.string().nullable().optional(),
});

export const reactionListResponseSchema = yup.object({
  reactions: yup.array().of(reactionSchema).required(),
  pagination: paginationSchema.optional(),
  message: yup.string().optional(),
});

export const reactionItemResponseSchema = yup.object({
  reaction: reactionSchema.required(),
  message: yup.string().optional(),
});
