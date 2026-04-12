import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { createTanent, updateTenant } from './tenants.server';
import { toast } from 'sonner';
import {
  createOrganizationSchema,
  CreateOrganizationFormValues,
} from '@/app/(auth)/onboarding/create-organization/create-organization.schema';
import { useMutation } from '@tanstack/react-query';
import { TenantData } from './tenants.type';
import { TenantUpdateInput } from './tenants.validation';

export function useCreateTanent() {
  const router = useRouter();

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
      form.reset();
      router.push('/recruiter/profile');
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
        onSuccessNext?.(data as Partial<TenantData>);
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
