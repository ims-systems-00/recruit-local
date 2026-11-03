import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CircleQuestionMark,
  EllipsisVertical,
  FileText,
  ImageIcon,
} from 'lucide-react';
import Image from 'next/image';
import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  TrainingData,
  useSoftDeleteTraining,
  useTrainingCertificateUrls,
} from '@/services/training';

// Dates are saved as a calendar day at UTC midnight, so the UTC year is the
// one the candidate picked in any timezone.
const yearOf = (date: string) => new Date(date).getUTCFullYear();

// "2022", "2022 - 2023", or "2025 - Present" while still enrolled.
const formatYears = (training: TrainingData) => {
  const start = yearOf(training.startDate);
  if (training.isCurrentlyEnrolled) return `${start} - Present`;
  if (!training.endDate) return `${start}`;
  const end = yearOf(training.endDate);
  return end === start ? `${start}` : `${start} - ${end}`;
};

// "UX Research + 4 Skills": the first skill, then how many more.
const formatSkills = (skills: string[]) => {
  if (!skills.length) return undefined;
  const rest = skills.length - 1;
  if (!rest) return skills[0];
  return `${skills[0]} + ${rest} ${rest === 1 ? 'Skill' : 'Skills'}`;
};

/**
 * The certificate's preview image. Certificates sit in private storage, so
 * the preview is shown through a short-lived signed URL.
 */
function CertificateThumbnail({
  thumbnailUrl,
}: {
  thumbnailUrl?: string | null;
}) {
  const [failed, setFailed] = useState(false);

  // No preview yet (still generating, or none made) or it failed to load.
  if (!thumbnailUrl || failed) {
    return <FileText className="text-others-brand-dark size-6" />;
  }

  return (
    <Image
      src={thumbnailUrl}
      alt="Certificate preview"
      fill
      unoptimized
      className="object-cover"
      onError={() => setFailed(true)}
    />
  );
}

export default function TrainingItem({
  training,
  onEdit,
  isViewMode,
}: {
  training: TrainingData;
  onEdit: () => void;
  isViewMode: boolean;
}) {
  const [openDeleteAlertDialog, setOpenDeleteAlertDialog] = useState(false);
  const { softDeleteTraining, isLoading } = useSoftDeleteTraining();

  const hasCertificate = !!training.certificate?.storageInformation?.Key;
  const skillNames = (training.skills ?? []).map((skill) => skill.name);
  const skillsSummary = formatSkills(skillNames);

  // Links are signed by the training's own endpoint, which checks the viewer
  // may read this training.
  const { certificateUrls, refetch: refetchCertificateUrls } =
    useTrainingCertificateUrls(training._id, hasCertificate);

  const openCertificate = async () => {
    // Opened before the await: Safari blocks a tab opened after one.
    const tab = window.open('', '_blank');
    if (tab) tab.opener = null;

    // Fetched fresh, so a page left open past the links' expiry still works.
    const { data, error } = await refetchCertificateUrls();
    if (data?.url && tab) {
      tab.location.href = data.url;
    } else {
      tab?.close();
      toast.error(error?.message || 'Could not open the certificate');
    }
  };

  return (
    <>
      <div className="bg-bg-gray-soft-primary rounded-2xl border border-border-gray-secondary shadow-xs p-spacing-4xl">
        <div className=" flex justify-between items-start gap-spacing-4xl">
          <div className=" flex flex-col sm:flex-row gap-spacing-2xs sm:gap-spacing-2xl min-w-0">
            {hasCertificate ? (
              <button
                type="button"
                onClick={openCertificate}
                aria-label={`Open certificate for ${training.courseName}`}
                className=" relative shrink-0 w-18 h-13 overflow-hidden rounded-lg bg-others-brand-brand-zero border border-others-brand-light flex items-center justify-center cursor-pointer"
              >
                <CertificateThumbnail
                  thumbnailUrl={certificateUrls?.thumbnailUrl}
                />
              </button>
            ) : (
              <div className=" shrink-0 w-18 h-13 rounded-lg bg-others-gray-gray-zero border border-others-gray-xlight flex items-center justify-center">
                <ImageIcon className="text-others-gray-default size-6" />
              </div>
            )}
            <div className=" space-y-spacing-3xs min-w-0">
              <p className=" text-label-md font-label-md-strong! text-text-gray-primary break-words">
                {training.courseName}
              </p>
              <div className="flex items-center gap-spacing-sm flex-wrap">
                <span className="text-label-sm text-text-gray-tertiary">
                  {training.organizationName}
                </span>
                <div className=" w-1.5 h-1.5 bg-fg-gray-tertiary rounded-full"></div>
                <span className="text-label-sm text-text-gray-tertiary">
                  {formatYears(training)}
                </span>
              </div>
              {skillsSummary && (
                <p
                  className="text-label-sm text-text-gray-tertiary"
                  title={skillNames.join(', ')}
                >
                  {skillsSummary}
                </p>
              )}
            </div>
          </div>
          {!isViewMode && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`Actions for ${training.courseName}`}
                  className="text-fg-gray-secondary flex items-center justify-center cursor-pointer"
                >
                  <EllipsisVertical size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32 bg-white">
                <DropdownMenuItem
                  onClick={onEdit}
                  className=" text-label-sm font-label-sm-strong! text-text-gray-secondary"
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setOpenDeleteAlertDialog(true)}
                  className=" text-label-sm font-label-sm-strong! text-text-gray-secondary"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      <AlertDialog
        open={openDeleteAlertDialog}
        onOpenChange={setOpenDeleteAlertDialog}
      >
        <AlertDialogContent className="bg-white min-w-[400px] max-w-[400px]! rounded-3xl border border-others-brand-light gap-spacing-5xl">
          <AlertDialogHeader className=" gap-spacing-2xl">
            <div className=" flex justify-center items-center rounded-xl w-12 h-12 min-w-12 min-h-12 bg-others-brand-brand-zero border border-others-brand-light">
              <CircleQuestionMark className="text-others-brand-dark" />
            </div>
            <div className="space-y-spacing-3xs">
              <AlertDialogTitle className="text-label-lg font-label-lg-strong! text-text-gray-primary">
                Delete this training?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-body-sm text-text-gray-tertiary">
                It will be removed from your profile.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-spacing-2xl">
            <AlertDialogCancel
              disabled={isLoading}
              className=" cursor-pointer flex-1 h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-secondary"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isLoading}
              onClick={() => softDeleteTraining(training._id)}
              className=" cursor-pointer flex-1 h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-white bg-bg-brand-solid-primary"
            >
              {isLoading ? 'Deleting...' : 'Yes, Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
