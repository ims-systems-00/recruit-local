import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { createTanent, getTenantById, updateTenant } from './tenants.server';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { TenantData } from './tenants.type';
import { TenantUpdateInput } from './tenants.validation';
import {
  CreateOrganizationFormValues,
  createOrganizationSchema,
} from '@/app/(auth)/recruiter/onboarding/create-organization/create-organization.schema';
import { useSession } from 'next-auth/react';

export const tenantKeys = {
  all: ['tenants'] as const,
  details: () => [...tenantKeys.all, 'detail'] as const,
  detail: (id: string) => [...tenantKeys.details(), id] as const,
};

export function useTenant(id?: string, isEnabled?: boolean) {
  const query = useQuery({
    queryKey: tenantKeys.detail(id ?? ''),
    enabled: !!id && isEnabled,
    queryFn: async () => {
      const response = await getTenantById(id!);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
  });

  return {
    tenant: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}

export function useCreateTanent() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const form = useForm<CreateOrganizationFormValues>({
    resolver: yupResolver(createOrganizationSchema),
  });

  const mutation = useMutation({
    mutationFn: createTanent,

    onSuccess: async (res, variables) => {
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(res.data.message);
      update({
        user: {
          ...session?.user,
          tenantId: res.data?._id,
        },
      });
      form.reset();
      router.push('/recruiter/onboarding/values');
    },
    onError: () => {
      toast.error('Something went wrong. Please try again.');
    },
  });

  return {
    // react-hook-form
    ...form,
    onSubmit: form.handleSubmit((data) => mutation.mutate(data)),

    // react-query state
    isSubmitting: mutation.isPending,
    isError: mutation.isError,
  };
}

export function useUpdateTenant() {
  const mutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<TenantUpdateInput>;
    }) => updateTenant(id, data),
  });

  const updateTenantAsync = async ({
    id,
    data,
    onSuccessNext,
  }: {
    id: string;
    data: Partial<TenantUpdateInput>;
    onSuccessNext?: (data: Partial<TenantData>) => void;
  }) => {
    try {
      const response = await mutation.mutateAsync({ id, data });

      if (response.success) {
        toast.success(response.message || 'Tenant updated successfully');
        onSuccessNext?.(response?.data as Partial<TenantData>);
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update Tenant');
    }
  };

  return {
    updateTenant: updateTenantAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
