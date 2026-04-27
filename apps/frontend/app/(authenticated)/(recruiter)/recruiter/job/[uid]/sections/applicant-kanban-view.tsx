import React from 'react';
import Kanban from './kanban/kanban';
import { useStatuses } from '@/services/status/status.client';

export default function ApplicantKanbanView({ jobId }: { jobId: string }) {
  const { statuses, isLoading } = useStatuses({
    collectionName: 'jobs',
    collectionId: jobId,
  });
  if (isLoading) return <div>Loading...</div>;
  return <Kanban statuses={statuses ?? []} jobId={jobId} />;
}
