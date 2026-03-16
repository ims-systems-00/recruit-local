import { EVENT_MODE_ENUMS, EVENT_TYPE_ENUMS } from '@rl/types';
import * as yup from 'yup';
import { paginationSchema } from '../shared';
import { VirtualEventData } from './event.type';

// ─── Reusable sub-schemas ─────────────────────────────────────────────────────

/**
 * AWS S3 storage reference — optional banner image upload payload.
 * Matches backend AwsStorageTemplate.
 */
const awsStorageSchema = yup.object({
    Name: yup.string().required('Image Name is required'),
    Bucket: yup.string().required('Bucket is required'),
    Key: yup.string().required('Key is required'),
});

/**
 * VirtualEvent sub-schema.
 * Aligned with backend `VirtualEvent` from @rl/types:
 *   { link: string; id?: string; password?: string }
 *
 * `link` is a required URL when the parent schema enforces it (via .when('mode')).
 */
const virtualEventSchema = yup.object({
    link: yup
        .string()
        .url('Meeting link must be a valid URL')
        .required('Meeting link is required'),
    id: yup.string().optional().nullable(),
    password: yup.string().optional().nullable(),
});

/** Regex for 24-hour HH:mm time format */
const HH_MM_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

// ─── Create schema ─────────────────────────────────────────────────────────────

export const eventCreateSchema = yup.object({
    organizers: yup
        .array()
        .of(yup.string().required('Organizer ID is required'))
        .min(1, 'At least one organizer is required')
        .required('Organizers are required'),

    title: yup.string().trim().max(150, 'Title cannot exceed 150 characters').required('Title is required'),
    type: yup
        .string()
        .oneOf(Object.values(EVENT_TYPE_ENUMS), 'Invalid event type')
        .required('Event type is required'),
    description: yup.string().required('Description is required'),
    location: yup.string().required('Location is required'),
    capacity: yup
        .number()
        .integer('Capacity must be a whole number')
        .min(1, 'Capacity must be at least 1')
        .required('Capacity is required'),
    startDate: yup.string().required('Start date is required'),

    startTime: yup
        .string()
        .matches(HH_MM_REGEX, 'Start time must be in HH:mm format')
        .required('Start time is required'),

    endDate: yup.string().required('End date is required'),

    endTime: yup
        .string()
        .matches(HH_MM_REGEX, 'End time must be in HH:mm format')
        .required('End time is required'),
    registrationEndDate: yup.string().required('Registration end date is required'),
    bannerImageStorage: awsStorageSchema.optional(),
    statusId: yup.string().required('Status is required'),
    mode: yup
        .string()
        .oneOf(Object.values(EVENT_MODE_ENUMS), 'Invalid event mode')
        .required('Mode is required'),
    virtualEvent: yup.mixed<VirtualEventData>()
        .when('mode', {
            is: (mode: string) =>
                mode === EVENT_MODE_ENUMS.VIRTUAL || mode === EVENT_MODE_ENUMS.HYBRID,
            then: () =>
                yup.object({
                    link: yup
                        .string()
                        .url('Meeting link must be a valid URL')
                        .required('Meeting link is required'),
                    id: yup.string().optional().nullable(),
                    password: yup.string().optional().nullable(),
                }).required('Virtual event details are required for this mode'),
            otherwise: () => yup.mixed().optional().nullable(),
        }),
})
    .test('date-ordering', 'Dates are inconsistent', function (values) {
        const { startDate, endDate, registrationEndDate } = values;
        if (!startDate || !endDate || !registrationEndDate) return true;

        const start = new Date(startDate);
        const end = new Date(endDate);
        const regEnd = new Date(registrationEndDate);

        const errors: yup.ValidationError[] = [];

        if (regEnd > start) {
            errors.push(this.createError({ path: 'registrationEndDate', message: 'Registration must end before or on start date' }));
        }
        if (end < start) {
            errors.push(this.createError({ path: 'endDate', message: 'End date must be after or on start date' }));
        }

        if (errors.length > 0) {
            throw new yup.ValidationError(errors);
        }
        return true;
    });

export const eventUpdateSchema = yup.object({
    organizers: yup
        .array()
        .of(yup.string().required())
        .min(1, 'At least one organizer is required')
        .optional(),

    title: yup.string().trim().max(150).optional(),
    type: yup
        .string()
        .oneOf(Object.values(EVENT_TYPE_ENUMS))
        .optional(),
    description: yup.string().optional(),
    location: yup.string().optional(),
    capacity: yup.number().integer().min(1).optional(),
    startDate: yup.string().optional(),
    startTime: yup
        .string()
        .matches(HH_MM_REGEX, 'Start time must be in HH:mm format')
        .optional(),
    endDate: yup.string().optional(),
    endTime: yup
        .string()
        .matches(HH_MM_REGEX, 'End time must be in HH:mm format')
        .optional(),
    registrationEndDate: yup.string().optional(),
    bannerImageStorage: awsStorageSchema.optional(),
    statusId: yup.string().optional(),
    mode: yup
        .string()
        .oneOf(Object.values(EVENT_MODE_ENUMS))
        .optional(),
    virtualEvent: yup.mixed()
        .when('mode', {
            is: (mode: string) =>
                mode === EVENT_MODE_ENUMS.VIRTUAL || mode === EVENT_MODE_ENUMS.HYBRID,
            then: () => virtualEventSchema.required('Virtual event details are required for this mode'),
            otherwise: () => yup.mixed().optional().nullable(),
        }),
})
    .test('date-ordering', 'Dates are inconsistent', function (values) {
        const { startDate, endDate, registrationEndDate } = values;

        // Only validate if all relevant fields are provided
        if (!startDate && !endDate && !registrationEndDate) return true;

        const errors: yup.ValidationError[] = [];

        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        const regEnd = registrationEndDate ? new Date(registrationEndDate) : null;

        if (regEnd && start && regEnd > start) {
            errors.push(this.createError({ path: 'registrationEndDate', message: 'Registration must end before or on start date' }));
        }
        if (end && start && end < start) {
            errors.push(this.createError({ path: 'endDate', message: 'End date must be after or on start date' }));
        }

        if (errors.length > 0) {
            throw new yup.ValidationError(errors);
        }
        return true;
    });

export const eventIdParamsSchema = yup.object({
    id: yup.string().required('ID is required'),
});

const deleteMarkerSchema = yup.object({
    status: yup.boolean().required(),
    deletedAt: yup.string().nullable().optional(),
    dateScheduled: yup.string().nullable().optional(),
});

export const eventSchema = yup.object({
    _id: yup.string().required(),
    organizers: yup.array().of(yup.string().required()).required(),
    title: yup.string().required(),
    type: yup
        .string()
        .oneOf(Object.values(EVENT_TYPE_ENUMS))
        .required(),

    description: yup.string().required(),
    location: yup.string().required(),
    capacity: yup.number().required(),
    startDate: yup.string().required(),
    startTime: yup.string().required(),
    endDate: yup.string().required(),
    endTime: yup.string().required(),
    registrationEndDate: yup.string().required(),
    bannerImageId: yup.string().nullable().optional(),
    statusId: yup.string().required(),
    mode: yup
        .string()
        .oneOf(Object.values(EVENT_MODE_ENUMS))
        .required(),

    /**
     * VirtualEvent — aligned with @rl/types `VirtualEvent`:
     *   link is required (string); id and password are optional.
     */
    virtualEvent: yup
        .object({
            link: yup.string().required(),
            id: yup.string().optional().nullable(),
            password: yup.string().optional().nullable(),
        })
        .optional()
        .nullable(),

    deleteMarker: deleteMarkerSchema.optional(),

    createdAt: yup.string().optional(),
    updatedAt: yup.string().optional(),
    deletedAt: yup.string().nullable().optional(),
});

// ─── List & item response schemas ─────────────────────────────────────────────

export const eventListResponseSchema = yup.object({
    events: yup.array().of(eventSchema).required(),
    pagination: paginationSchema.required(),
    message: yup.string().optional(),
    statusCode: yup.number().optional(),
});

export const eventItemResponseSchema = yup.object({
    event: eventSchema.required(),
    message: yup.string().optional(),
    statusCode: yup.number().optional(),
});
