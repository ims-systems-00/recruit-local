import React from 'react';
import Kanban from './kanban/kanban';
import { useAllStatuses } from '@/services/status/status.client';
import { KanbanSkeleton } from './kanban/kanban-skeleton';

export default function ApplicantKanbanView({ jobId }: { jobId: string }) {
  // Every status is a column, so load all of them — not just the first page.
  const { statuses, isLoading } = useAllStatuses({
    collectionName: 'jobs',
    collectionId: jobId,
  });
  if (isLoading) return <KanbanSkeleton />;
  return <Kanban statuses={statuses ?? []} jobId={jobId} />;
}
