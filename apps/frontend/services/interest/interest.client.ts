'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getInterests,
    getInterestById,
    createInterest,
    updateInterest,
    softDeleteInterest,
    hardDeleteInterest,
    restoreInterest,
} from './interest.server';
import type {
    InterestCreateInput,
    InterestUpdateInput,
    InterestData,
    InterestListResponse,
    InterestListFilters,
} from './interest.type';

// Query keys
export const interestKeys = {
    all: ['interests'] as const,
    lists: () => [...interestKeys.all, 'list'] as const,
    list: (filters: InterestListFilters) =>
        [...interestKeys.lists(), filters] as const,
    details: () => [...interestKeys.all, 'detail'] as const,
    detail: (id: string) => [...interestKeys.details(), id] as const,
};

// Hook to fetch list of interests
export function useInterests(filters: InterestListFilters = {}) {
    const query = useQuery<InterestListResponse, Error>({
        queryKey: interestKeys.list(filters),
        queryFn: async () => {
            const response = await getInterests(filters);
            if (!response.success) {
                throw new Error(response.message);
            }
            return response.data;
        },
    });

    return {
        interests: query.data?.docs || [],
        pagination: query.data?.pagination,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
        isFetching: query.isFetching,
    };
}

// Hook to fetch a single interest by ID
export function useInterest(id: string) {
    const query = useQuery<InterestData, Error>({
        queryKey: interestKeys.detail(id),
        queryFn: async () => {
            const response = await getInterestById(id);
            if (!response.success) {
                throw new Error(response.message);
            }
            return response.data;
        },
        enabled: !!id,
    });

    return {
        interest: query.data,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    };
}

// Hook to create a new interest
export function useCreateInterest() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (payload: InterestCreateInput) => createInterest(payload),
        onSuccess: (response) => {
            if (response.success) {
                toast.success(response.message || 'Interest created successfully');
                queryClient.invalidateQueries({ queryKey: interestKeys.all });
            } else {
                toast.error(response.message);
            }
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to create interest');
        },
    });

    return {
        createInterest: mutation.mutateAsync,
        isLoading: mutation.isPending,
        error: mutation.error,
    };
}

// Hook to update an existing interest
export function useUpdateInterest() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: InterestUpdateInput;
        }) => updateInterest(id, payload),
        onSuccess: (response) => {
            if (response.success) {
                toast.success(response.message || 'Interest updated successfully');
                queryClient.invalidateQueries({ queryKey: interestKeys.all });
            } else {
                toast.error(response.message);
            }
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to update interest');
        },
    });

    return {
        updateInterest: mutation.mutateAsync,
        isLoading: mutation.isPending,
        error: mutation.error,
    };
}

// Hook to soft delete an interest
export function useSoftDeleteInterest() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (id: string) => softDeleteInterest(id),
        onSuccess: (response) => {
            if (response.success) {
                toast.success(response.message || 'Interest removed successfully');
                queryClient.invalidateQueries({ queryKey: interestKeys.all });
            } else {
                toast.error(response.message);
            }
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to remove interest');
        },
    });

    return {
        softDeleteInterest: mutation.mutateAsync,
        isLoading: mutation.isPending,
        error: mutation.error,
    };
}

// Hook to hard delete an interest
export function useHardDeleteInterest() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (id: string) => hardDeleteInterest(id),
        onSuccess: (response) => {
            if (response.success) {
                toast.success(response.message || 'Interest permanently removed');
                queryClient.invalidateQueries({ queryKey: interestKeys.all });
            } else {
                toast.error(response.message);
            }
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to permanently remove interest');
        },
    });

    return {
        hardDeleteInterest: mutation.mutateAsync,
        isLoading: mutation.isPending,
        error: mutation.error,
    };
}

// Hook to restore a deleted interest
export function useRestoreInterest() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (id: string) => restoreInterest(id),
        onSuccess: (response) => {
            if (response.success) {
                toast.success(response.message || 'Interest restored successfully');
                queryClient.invalidateQueries({ queryKey: interestKeys.all });
            } else {
                toast.error(response.message);
            }
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to restore interest');
        },
    });

    return {
        restoreInterest: mutation.mutateAsync,
        isLoading: mutation.isPending,
        error: mutation.error,
    };
}
