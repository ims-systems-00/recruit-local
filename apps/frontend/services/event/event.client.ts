'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    softDeleteEvent,
    hardDeleteEvent,
    restoreEvent,
} from './event.server';
import type {
    EventCreateInput,
    EventUpdateInput,
    EventData,
    EventListResponse,
    EventListFilters,
} from './event.type';

// Query keys
export const eventKeys = {
    all: ['events'] as const,
    lists: () => [...eventKeys.all, 'list'] as const,
    list: (filters: EventListFilters) =>
        [...eventKeys.lists(), filters] as const,
    details: () => [...eventKeys.all, 'detail'] as const,
    detail: (id: string) => [...eventKeys.details(), id] as const,
};

// Hook to fetch list of events
export function useEvents(filters: EventListFilters = {}) {
    const query = useQuery<EventListResponse, Error>({
        queryKey: eventKeys.list(filters),
        queryFn: async () => {
            const response = await getEvents(filters);
            if (!response.success) {
                throw new Error(response.message);
            }
            return response.data;
        },
    });

    return {
        events: query.data?.docs || [],
        pagination: query.data?.pagination,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
        isFetching: query.isFetching,
    };
}

// Hook to fetch a single event by ID
export function useEvent(id: string) {
    const query = useQuery<EventData, Error>({
        queryKey: eventKeys.detail(id),
        queryFn: async () => {
            const response = await getEventById(id);
            if (!response.success) {
                throw new Error(response.message);
            }
            return response.data;
        },
        enabled: !!id,
    });

    return {
        event: query.data,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    };
}

// Hook to create a new event
export function useCreateEvent() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (payload: EventCreateInput) => createEvent(payload),
        onSuccess: (response) => {
            if (response.success) {
                toast.success(response.message || 'Event created successfully');
                queryClient.invalidateQueries({ queryKey: eventKeys.all });
            } else {
                toast.error(response.message);
            }
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to create event');
        },
    });

    return {
        createEvent: mutation.mutateAsync,
        isPending: mutation.isPending,
        error: mutation.error,
    };
}

// Hook to update an existing event
export function useUpdateEvent() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: EventUpdateInput;
        }) => updateEvent(id, payload),
        onSuccess: (response) => {
            if (response.success) {
                toast.success(response.message || 'Event updated successfully');
                queryClient.invalidateQueries({ queryKey: eventKeys.all });
            } else {
                toast.error(response.message);
            }
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to update event');
        },
    });

    return {
        updateEvent: mutation.mutateAsync,
        isPending: mutation.isPending,
        error: mutation.error,
    };
}

// Hook to soft delete an event
export function useSoftDeleteEvent() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (id: string) => softDeleteEvent(id),
        onSuccess: (response) => {
            if (response.success) {
                toast.success(response.message || 'Event removed successfully');
                queryClient.invalidateQueries({ queryKey: eventKeys.all });
            } else {
                toast.error(response.message);
            }
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to remove event');
        },
    });

    return {
        softDeleteEvent: mutation.mutateAsync,
        isPending: mutation.isPending,
        error: mutation.error,
    };
}

// Hook to hard delete an event
export function useHardDeleteEvent() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (id: string) => hardDeleteEvent(id),
        onSuccess: (response) => {
            if (response.success) {
                toast.success(response.message || 'Event permanently removed');
                queryClient.invalidateQueries({ queryKey: eventKeys.all });
            } else {
                toast.error(response.message);
            }
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to permanently remove event');
        },
    });

    return {
        hardDeleteEvent: mutation.mutateAsync,
        isPending: mutation.isPending,
        error: mutation.error,
    };
}

// Hook to restore a deleted event
export function useRestoreEvent() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (id: string) => restoreEvent(id),
        onSuccess: (response) => {
            if (response.success) {
                toast.success(response.message || 'Event restored successfully');
                queryClient.invalidateQueries({ queryKey: eventKeys.all });
            } else {
                toast.error(response.message);
            }
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to restore event');
        },
    });

    return {
        restoreEvent: mutation.mutateAsync,
        isPending: mutation.isPending,
        error: mutation.error,
    };
}
