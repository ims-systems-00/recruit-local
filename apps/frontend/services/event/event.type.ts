import * as yup from 'yup';
import { eventCreateSchema, eventIdParamsSchema, eventUpdateSchema } from './event.validation';
import { Pagination } from '@/types/api';
import { EVENT_MODE_ENUMS, EVENT_TYPE_ENUMS } from '@rl/types';

export type EventCreateInput = yup.InferType<typeof eventCreateSchema>;
export type EventUpdateInput = yup.InferType<typeof eventUpdateSchema>;
export type EventIdParams = yup.InferType<typeof eventIdParamsSchema>;
export type EventListFilters = {
    page?: number;
    limit?: number;
    search?: string;
    statusId?: string;
    type?: EVENT_TYPE_ENUMS;
    mode?: EVENT_MODE_ENUMS;
    startDate?: string;
    endDate?: string;
};

export type VirtualEventData = {
    link: string;
    id?: string | null;
    password?: string | null;
};

export type DeleteMarkerData = {
    status: boolean;
    deletedAt?: string | null;
    dateScheduled?: string | null;
};

export type EventData = {
    _id: string;
    organizers: string[];
    title: string;
    type: EVENT_TYPE_ENUMS;
    description: string;
    location: string;
    capacity: number;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    registrationEndDate: string;
    bannerImageId?: string | null;
    statusId: string;
    mode: EVENT_MODE_ENUMS;
    virtualEvent?: VirtualEventData | null;
    deleteMarker?: DeleteMarkerData;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
};

// --- Backend API response shapes ---
export type EventListBackendResponse = {
    success: boolean;
    events: EventData[];
    pagination: Pagination;
    message?: string;
    statusCode?: number;
};

export type EventItemBackendResponse = {
    success: boolean;
    event: EventData;
    message?: string;
    statusCode?: number;
};

// --- Normalised response used by the frontend ---
export type EventListResponse = {
    docs: EventData[];
    pagination: Pagination;
};
