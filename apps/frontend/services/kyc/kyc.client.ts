import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  KycCreateInput,
  Kyc,
  KycListResponse,
  KycListFilters,
} from './kyc.type';
import { createKyc, getKycList } from './kyc.server';
import { toast } from 'sonner';

export const kycKeys = {
  all: ['kycs'] as const,
  lists: () => [...kycKeys.all, 'list'] as const,
  list: (filters: KycListFilters) => [...kycKeys.lists(), filters] as const,
  details: () => [...kycKeys.all, 'detail'] as const,
  detail: (id: string) => [...kycKeys.details(), id] as const,
};

export function useKycList(filters: KycListFilters = {}, isEnabled = true) {
  const query = useQuery<KycListResponse, Error>({
    queryKey: kycKeys.list(filters),
    queryFn: async () => {
      const response = await getKycList(filters);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    enabled: isEnabled,
  });

  return {
    kyc: query.data?.kyc || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

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
