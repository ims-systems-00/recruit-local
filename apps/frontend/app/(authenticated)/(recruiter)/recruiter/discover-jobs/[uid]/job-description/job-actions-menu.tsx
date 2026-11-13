'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useCreateFavourite,
  useSoftDeleteFavourite,
} from '@/services/favourite/favourite.client';
import { JobData } from '@/services/jobs/job.type';
import { useDuplicateJob } from '@/services/jobs/jobs.client';
import { EllipsisVertical, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import JobStatusDialog from '@/components/job-status-dialog';

const itemClassName =
  'cursor-pointer px-spacing-lg py-spacing-md text-label-sm font-label-sm-strong! text-text-gray-secondary';

/**
 * The ⋮ menu on a Discover job: copy it into the recruiter's organisation, save
 * it, or share a link to it. On the recruiter's own job it can also close it.
 */
export default function JobActionsMenu({ job }: { job: JobData }) {
  // The favourite's id while the job is saved, null while it is not.
  const [savedId, setSavedId] = useState(job.alreadySavedId ?? null);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const router = useRouter();

  // Discover lists every open job, the recruiter's own included. Only those can
  // be closed; the server refuses any other. The tenantId check stops a match
  // when neither side has an organisation.
  const { data: session } = useSession();
  const isOwnJob =
    Boolean(job.tenantId) && job.tenantId === session?.user?.tenantId;

  const { duplicateJob, isPending: isDuplicating } = useDuplicateJob();
  const { createFavourite, isPending: isSaving } = useCreateFavourite((data) =>
    setSavedId(data._id),
  );
  const { softDeleteFavourite, isPending: isUnsaving } = useSoftDeleteFavourite(
    () => setSavedId(null),
  );

  // The trigger is disabled while any action runs, so the menu cannot be
  // reopened to fire a second copy or a second save.
  const isBusy = isDuplicating || isSaving || isUnsaving;

  const onToggleSaved = () =>
    savedId
      ? softDeleteFavourite(savedId)
      : createFavourite({ itemId: job._id, itemType: 'jobs' });

  // The public job page, so the link also opens for someone who is not signed in.
  const onShare = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/jobs/${job._id}`,
      );
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label="Job actions"
            disabled={isBusy}
            className="cursor-pointer w-9! p-spacing-0! bg-bg-gray-soft-primary hover:bg-bg-gray-soft-primary border border-border-gray-primary h-9 text-text-gray-secondary! rounded-lg"
          >
            {isBusy ? (
              <Loader2 className="animate-spin" />
            ) : (
              <EllipsisVertical />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60 bg-white">
          <DropdownMenuItem
            className={itemClassName}
            onSelect={() => duplicateJob(job._id)}
          >
            Duplicate this Job
          </DropdownMenuItem>
          <DropdownMenuItem className={itemClassName} onSelect={onShare}>
            Share
          </DropdownMenuItem>
          <DropdownMenuItem className={itemClassName} onSelect={onToggleSaved}>
            {savedId ? 'Unsave job' : 'Save job'}
          </DropdownMenuItem>
          {isOwnJob && (
            <DropdownMenuItem
              className={itemClassName}
              onSelect={() => setCloseDialogOpen(true)}
            >
              Close job
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Outside the menu, so it stays mounted after the menu closes. */}
      {isOwnJob && (
        <JobStatusDialog
          jobId={job._id}
          change="close"
          open={closeDialogOpen}
          onOpenChange={setCloseDialogOpen}
          onSuccess={() => router.push(`/recruiter/job/${job._id}`)}
        />
      )}
    </>
  );
}
