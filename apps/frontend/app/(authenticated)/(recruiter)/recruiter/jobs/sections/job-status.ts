import { JOBS_STATUS_ENUMS } from '@rl/types';
import { JobData } from '@/services/jobs/job.type';

export function isJobExpired(job: Pick<JobData, 'endDate'>) {
  return Boolean(job.endDate) && new Date(job.endDate) < new Date();
}

export function getJobStatusActions(job: Pick<JobData, 'status'>) {
  return {
    canEdit: job.status !== JOBS_STATUS_ENUMS.OPEN,
    canClose: job.status === JOBS_STATUS_ENUMS.OPEN,
    canPublish: job.status === JOBS_STATUS_ENUMS.CLOSED,
  };
}
