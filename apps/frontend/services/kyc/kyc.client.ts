import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KycCreateInput, Kyc } from './kyc.type';
import { createKyc } from './kyc.server';
import { toast } from 'sonner';

export const kycKeys = {
  all: ['kycs'] as const,
  lists: () => [...kycKeys.all, 'list'] as const,
  details: () => [...kycKeys.all, 'detail'] as const,
  detail: (id: string) => [...kycKeys.details(), id] as const,
};

export function useCreateKyc() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: KycCreateInput) => createKyc(payload),
  });

  const createKycAsync = async ({
    payload,
    onSuccessCallback,
  }: {
    payload: KycCreateInput;
    onSuccessCallback?: (data: Kyc) => void;
  }) => {
    try {
      const response = await mutation.mutateAsync(payload);

      if (response.success) {
        toast.success(response.message || 'Kyc created successfully');
        queryClient.invalidateQueries({ queryKey: kycKeys.all });
        onSuccessCallback?.(response.data as Kyc);
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create kyc');
    }
  };

  return {
    createKyc: createKycAsync,
    isSubmitting: mutation.isPending,
    error: mutation.error,
  };
}
