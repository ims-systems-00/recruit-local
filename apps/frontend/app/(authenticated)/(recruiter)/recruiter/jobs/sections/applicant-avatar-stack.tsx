import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { JobApplicantPreviewDto } from '@rl/types';

// Wider counts would overflow the size-6 bubble.
const formatRemaining = (count: number) => (count > 99 ? '99+' : `+${count}`);

/**
 * Overlapping avatars of a job's latest applicants, then "+N" for everyone else
 * who applied. An applicant without a public photo shows their initial.
 * Renders nothing when there is no one to show.
 */
export default function ApplicantAvatarStack({
  applicants = [],
  total = 0,
}: {
  applicants?: JobApplicantPreviewDto[];
  total?: number;
}) {
  if (!applicants.length) return null;

  // `total` is a stored counter and `applicants` a live lookup, so the two can
  // briefly disagree — never show a negative remainder.
  const remaining = Math.max(total - applicants.length, 0);

  return (
    <div className="flex items-center">
      {applicants.map((applicant) => (
        <Avatar
          key={applicant._id}
          title={applicant.name}
          className=" size-6 -ml-1.5 first:ml-0 border border-white text-body-xs"
        >
          {applicant.profileImage?.src && (
            <AvatarImage
              src={applicant.profileImage.src}
              alt={applicant.name || 'Applicant'}
            />
          )}
          <AvatarFallback>
            {applicant.name?.charAt(0).toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
      ))}
      {remaining > 0 && (
        <Avatar className="-ml-1.5 size-6 bg-gray-200 border border-white text-body-xs">
          <AvatarFallback>{formatRemaining(remaining)}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
