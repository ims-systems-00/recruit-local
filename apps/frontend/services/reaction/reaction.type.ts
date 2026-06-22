import * as yup from 'yup';
import {
  reactionCreateSchema,
  reactionIdParamsSchema,
  reactionUpdateSchema,
} from './reaction.validation';
import { ReactionType } from '@rl/types';
import { Pagination } from '@/types/api';

// TypeScript types
export type ReactionCreateInput = yup.InferType<typeof reactionCreateSchema>;
export type ReactionUpdateInput = yup.InferType<typeof reactionUpdateSchema>;
export type ReactionIdParams = yup.InferType<typeof reactionIdParamsSchema>;

// Filters for GET list (backend uses collectionId + optional collectionName, not full pagination)
export type ReactionListFilters = {
  collectionId: string;
  collectionName?: string;
};

// API Response types
export type ReactionData = {
  _id: string;
  userId: string;
  collectionName: string;
  collectionId: string;
  type: ReactionType;
  deleteMarker?: {
    status: boolean;
    deletedAt?: string | null;
    dateScheduled?: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type ReactionListBackendResponse = {
  success: boolean;
  reactions: ReactionData[];
  pagination?: Pagination;
  message?: string;
};

export type ReactionItemBackendResponse = {
  success: boolean;
  reaction: ReactionData;
  message?: string;
};

export type ReactionListResponse = {
  docs: ReactionData[];
  pagination?: Pagination;
};
