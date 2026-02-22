import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { createTanent } from './tenants.server';
import { toast } from 'sonner';
import {
  createOrganizationSchema,
  CreateOrganizationFormValues,
} from '@/app/(auth)/onboarding/create-organization/create-organization.schema';
import { useMutation } from '@tanstack/react-query';

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
