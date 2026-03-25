'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getForms,
  getFormById,
  createForm,
  updateForm,
  softDeleteForm,
  hardDeleteForm,
  restoreForm,
} from './form.server';
import type {
  FormCreateInput,
  FormUpdateInput,
  Form,
  FormListFilters,
} from './form.type';

// --- QUERY KEYS ---
export const formKeys = {
  all: ['forms'] as const,
  lists: () => [...formKeys.all, 'list'] as const,
  list: (filters: FormListFilters) => [...formKeys.lists(), filters] as const,
  details: () => [...formKeys.all, 'detail'] as const,
  detail: (id: string) => [...formKeys.details(), id] as const,
};

export function useForms(filters: FormListFilters = {}) {
  return useQuery({
    queryKey: formKeys.list(filters),
    queryFn: async () => {
      const response = await getForms(filters);
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
  });
}

export function useForm(id: string) {
  return useQuery({
    queryKey: formKeys.detail(id),
    queryFn: async () => {
      const response = await getFormById(id);
      if (!response.success) throw new Error(response.message);
      return response.data as Form;
    },
    enabled: !!id,
  });
}

// --- MUTATIONS ---
export function useCreateForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FormCreateInput) => createForm(payload),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message || 'Form created successfully');
        queryClient.invalidateQueries({ queryKey: formKeys.lists() });
      } else {
        toast.error(res.message);
      }
    },
    onError: (err) => toast.error(err.message || 'An error occurred'),
  });
}

export function useUpdateForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: FormUpdateInput }) =>
      updateForm(id, payload),
    onSuccess: (res, variables) => {
      if (res.success) {
        toast.success(res.message || 'Form updated successfully');
        queryClient.invalidateQueries({ queryKey: formKeys.lists() });
        queryClient.invalidateQueries({
          queryKey: formKeys.detail(variables.id),
        });
      } else {
        toast.error(res.message);
      }
    },
    onError: (err) => toast.error(err.message || 'An error occurred'),
  });
}

export function useSoftDeleteForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => softDeleteForm(id),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Form moved to trash');
        queryClient.invalidateQueries({ queryKey: formKeys.lists() });
      } else {
        toast.error(res.message);
      }
    },
  });
}

export function useRestoreForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreForm(id),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Form restored successfully');
        queryClient.invalidateQueries({ queryKey: formKeys.lists() });
      } else {
        toast.error(res.message);
      }
    },
  });
}

export function useHardDeleteForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hardDeleteForm(id),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Form permanently deleted');
        queryClient.invalidateQueries({ queryKey: formKeys.lists() });
      } else {
        toast.error(res.message);
      }
    },
  });
}
