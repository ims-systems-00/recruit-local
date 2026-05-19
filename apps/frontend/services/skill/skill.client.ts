'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getSkills,
    getSkillById,
    createSkill,
    updateSkill,
    softDeleteSkill,
    hardDeleteSkill,
    restoreSkill,
} from './skill.server';
import type {
    SkillCreateInput,
    SkillUpdateInput,
    SkillData,
    SkillListResponse,
    SkillListFilters,
} from './skill.type';

// Query keys
export const skillKeys = {
    all: ['skills'] as const,
    lists: () => [...skillKeys.all, 'list'] as const,
    list: (filters: SkillListFilters) =>
        [...skillKeys.lists(), filters] as const,
    details: () => [...skillKeys.all, 'detail'] as const,
    detail: (id: string) => [...skillKeys.details(), id] as const,
};

// Hook to fetch list of skills
export function useSkills(filters: SkillListFilters = {}) {
    const query = useQuery<SkillListResponse, Error>({
        queryKey: skillKeys.list(filters),
        queryFn: async () => {
            const response = await getSkills(filters);
            if (!response.success) {
                throw new Error(response.message);
            }
            return response.data;
        },
    });

    return {
        skills: query.data?.docs || [],
        pagination: query.data?.pagination,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
        isFetching: query.isFetching,
    };
}

// Hook to fetch a single skill by ID
export function useSkill(id: string) {
    const query = useQuery<SkillData, Error>({
        queryKey: skillKeys.detail(id),
        queryFn: async () => {
            const response = await getSkillById(id);
            if (!response.success) {
                throw new Error(response.message);
            }
            return response.data;
        },
        enabled: !!id,
    });

    return {
        skill: query.data,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    };
}

// Hook to create a new skill
export function useCreateSkill() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (payload: SkillCreateInput) => createSkill(payload),
        onSuccess: (response) => {
            if (response.success) {
                toast.success(response.message || 'Skill created successfully');
                queryClient.invalidateQueries({ queryKey: skillKeys.all });
            } else {
                toast.error(response.message);
            }
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to create skill');
        },
    });

    return {
        createSkill: mutation.mutateAsync,
        isLoading: mutation.isPending,
        error: mutation.error,
    };
}

// Hook to update an existing skill
export function useUpdateSkill() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: SkillUpdateInput;
        }) => updateSkill(id, payload),
        onSuccess: (response) => {
            if (response.success) {
                toast.success(response.message || 'Skill updated successfully');
                queryClient.invalidateQueries({ queryKey: skillKeys.all });
            } else {
                toast.error(response.message);
            }
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to update skill');
        },
    });

    return {
        updateSkill: mutation.mutateAsync,
        isLoading: mutation.isPending,
        error: mutation.error,
    };
}

// Hook to soft delete a skill
export function useSoftDeleteSkill() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (id: string) => softDeleteSkill(id),
        onSuccess: (response) => {
            if (response.success) {
                toast.success(response.message || 'Skill removed successfully');
                queryClient.invalidateQueries({ queryKey: skillKeys.all });
            } else {
                toast.error(response.message);
            }
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to remove skill');
        },
    });

    return {
        softDeleteSkill: mutation.mutateAsync,
        isLoading: mutation.isPending,
        error: mutation.error,
    };
}

// Hook to hard delete a skill
export function useHardDeleteSkill() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (id: string) => hardDeleteSkill(id),
        onSuccess: (response) => {
            if (response.success) {
                toast.success(response.message || 'Skill permanently removed');
                queryClient.invalidateQueries({ queryKey: skillKeys.all });
            } else {
                toast.error(response.message);
            }
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to permanently remove skill');
        },
    });

    return {
        hardDeleteSkill: mutation.mutateAsync,
        isLoading: mutation.isPending,
        error: mutation.error,
    };
}

// Hook to restore a deleted skill
export function useRestoreSkill() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (id: string) => restoreSkill(id),
        onSuccess: (response) => {
            if (response.success) {
                toast.success(response.message || 'Skill restored successfully');
                queryClient.invalidateQueries({ queryKey: skillKeys.all });
            } else {
                toast.error(response.message);
            }
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to restore skill');
        },
    });

    return {
        restoreSkill: mutation.mutateAsync,
        isLoading: mutation.isPending,
        error: mutation.error,
    };
}
