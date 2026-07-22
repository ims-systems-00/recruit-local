'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getCertifications,
    getCertificationById,
    createCertification,
    updateCertification,
    softDeleteCertification,
    hardDeleteCertification,
    restoreCertification,
} from './certification.server';
import type {
    CertificationCreateInput,
    CertificationUpdateInput,
    CertificationData,
    CertificationListResponse,
    CertificationListFilters,
} from './certification.type';

// Query keys
export const certificationKeys = {
    all: ['certifications'] as const,
    lists: () => [...certificationKeys.all, 'list'] as const,
    list: (filters: CertificationListFilters) =>
        [...certificationKeys.lists(), filters] as const,
    details: () => [...certificationKeys.all, 'detail'] as const,
    detail: (id: string) => [...certificationKeys.details(), id] as const,
};

// Hook to fetch list of certifications
export function useCertifications(filters: CertificationListFilters = {}) {
    const query = useQuery<CertificationListResponse, Error>({
        queryKey: certificationKeys.list(filters),
        queryFn: async () => {
            const response = await getCertifications(filters);
            if (!response.success) {
                throw new Error(response.message);
            }
            return response.data;
        },
    });

    return {
        certifications: query.data?.docs || [],
        pagination: query.data?.pagination,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
        isFetching: query.isFetching,
    };
}

// Hook to fetch a single certification by ID
export function useCertification(id: string) {
    const query = useQuery<CertificationData, Error>({
        queryKey: certificationKeys.detail(id),
        queryFn: async () => {
            const response = await getCertificationById(id);
            if (!response.success) {
                throw new Error(response.message);
            }
            return response.data;
        },
        enabled: !!id,
    });

    return {
        certification: query.data,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    };
}

// Hook to create a new certification
export function useCreateCertification() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (payload: CertificationCreateInput) => createCertification(payload),
        onSuccess: (response) => {
            if (response.success) {
                toast.success(response.message || 'Certification created successfully');
                queryClient.invalidateQueries({ queryKey: certificationKeys.all });
            } else {
                toast.error(response.message);
            }
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to create certification');
        },
    });

    return {
        createCertification: mutation.mutateAsync,
        isPending: mutation.isPending,
        error: mutation.error,
    };
}

// Hook to update an existing certification
export function useUpdateCertification() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: CertificationUpdateInput;
        }) => updateCertification(id, payload),
        onSuccess: (response) => {
            if (response.success) {
                toast.success(response.message || 'Certification updated successfully');
                queryClient.invalidateQueries({ queryKey: certificationKeys.all });
            } else {
                toast.error(response.message);
            }
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to update certification');
        },
    });

    return {
        updateCertification: mutation.mutateAsync,
        isPending: mutation.isPending,
        error: mutation.error,
    };
}

// Hook to soft delete a certification
export function useSoftDeleteCertification() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (id: string) => softDeleteCertification(id),
        onSuccess: (response) => {
            if (response.success) {
                toast.success(response.message || 'Certification removed successfully');
                queryClient.invalidateQueries({ queryKey: certificationKeys.all });
            } else {
                toast.error(response.message);
            }
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to remove certification');
        },
    });

    return {
        softDeleteCertification: mutation.mutateAsync,
        isPending: mutation.isPending,
        error: mutation.error,
    };
}

// Hook to hard delete a certification
export function useHardDeleteCertification() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (id: string) => hardDeleteCertification(id),
        onSuccess: (response) => {
            if (response.success) {
                toast.success(response.message || 'Certification permanently removed');
                queryClient.invalidateQueries({ queryKey: certificationKeys.all });
            } else {
                toast.error(response.message);
            }
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to permanently remove certification');
        },
    });

    return {
        hardDeleteCertification: mutation.mutateAsync,
        isPending: mutation.isPending,
        error: mutation.error,
    };
}

// Hook to restore a deleted certification
export function useRestoreCertification() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (id: string) => restoreCertification(id),
        onSuccess: (response) => {
            if (response.success) {
                toast.success(response.message || 'Certification restored successfully');
                queryClient.invalidateQueries({ queryKey: certificationKeys.all });
            } else {
                toast.error(response.message);
            }
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to restore certification');
        },
    });

    return {
        restoreCertification: mutation.mutateAsync,
        isPending: mutation.isPending,
        error: mutation.error,
    };
}
