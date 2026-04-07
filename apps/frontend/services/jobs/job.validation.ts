import * as yup from 'yup';
import { JobData } from './job.type';

export const jobIdParamsSchema = yup.object({
  id: yup.string().required('ID is required'),
});

export type JobItemBackendResponse = {
  success: boolean;
  job: JobData;
  message?: string;
};
