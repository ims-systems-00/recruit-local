'use server';

import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';
import { Kyc, KycApiResponse, KycCreateInput } from './kyc.type';
import { kycCreateValidationSchema } from './kyc.validation';

const API_ENDPOINT = '/kycs';

export async function createKyc(
  payload: KycCreateInput,
): Promise<KycApiResponse<Kyc>> {
  try {
    const validatedPayload = await kycCreateValidationSchema.validate(payload, {
      abortEarly: false,
    });

    const res = await axiosServer.post(API_ENDPOINT, validatedPayload);

    // const validatedResponse = await jobProfileItemResponseSchema.validate(
    //   res.data,
    //   {
    //     stripUnknown: true,
    //   },
    // );

    return {
      success: true,
      data: res.data.kyc,
      message: res.data.message || 'Kyc created successfully',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to create kyc');
  }
}
