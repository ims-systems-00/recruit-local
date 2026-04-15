import * as yup from 'yup';
import {
  favouriteCreateSchema,
  favouriteIdParamsSchema,
  favouriteUpdateSchema,
} from './favourite.validation';
import { Pagination } from '@/types/api';

// TypeScript types
export type FavouriteCreateInput = yup.InferType<typeof favouriteCreateSchema>;
export type FavouriteUpdateInput = yup.InferType<typeof favouriteUpdateSchema>;
export type FavouriteIdParams = yup.InferType<typeof favouriteIdParamsSchema>;

export type FavouriteListFilters = {
  page?: number;
  limit?: number;
  userId?: string;
  itemId?: string;
  itemType?: string;
  startDate?: string;
  endDate?: string;
};

// API Response types
export type FavouriteData = {
  _id: string;
  userId: string;
  itemId: string;
  itemType: string;
  deleteMarker?: {
    status: boolean;
    deletedAt?: string | null;
    dateScheduled?: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type FavouriteListBackendResponse = {
  success: boolean;
  favourites: FavouriteData[];
  pagination?: Pagination;
  message?: string;
};

export type FavouriteItemBackendResponse = {
  success: boolean;
  favourite: FavouriteData;
  message?: string;
};

export type FavouriteListResponse = {
  docs: FavouriteData[];
  pagination?: Pagination;
};
