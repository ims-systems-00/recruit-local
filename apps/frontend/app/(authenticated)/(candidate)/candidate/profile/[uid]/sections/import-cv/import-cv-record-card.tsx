'use client';

import { ReactNode } from 'react';
import { BriefcaseBusiness, GraduationCap } from 'lucide-react';
import { differenceInMonths } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { CvRecords } from '@/services/cv/cv.type';
import { EMPLOYMENT_TYPE_OPTIONS } from '../work-experience/create-edit-work-experience-form';

type ExperienceRow = CvRecords['experience'][number];
type EducationRow = CvRecords['education'][number];
type TrainingRow = CvRecords['training'][number];

/** What a card shows: a title, then lines of facts with dots between them. */
type CardText = { title: string; lines: (string | undefined)[][] };

// CV dates are a calendar day at UTC midnight, so they are read in UTC: the
// month the CV gave in any timezone.
const monthOf = (date: string | Date) =>
  new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

const yearOf = (date: string | Date) => new Date(date).getUTCFullYear();

/** "3 mos", "1 yr 2 mos"; nothing under a month. */
const formatDuration = (start: string | Date, end?: string | Date) => {
  const months = differenceInMonths(
    end ? new Date(end) : new Date(),
    new Date(start),
  );
  if (months < 1) return undefined;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return [
    years && `${years} ${years === 1 ? 'yr' : 'yrs'}`,
    rest && `${rest} ${rest === 1 ? 'mo' : 'mos'}`,
  ]
    .filter(Boolean)
    .join(' ');
};

const employmentTypeLabel = (value?: string) =>
  EMPLOYMENT_TYPE_OPTIONS.find((option) => option.value === value)?.label;

// As the profile's Work Experience card: no end date is a current job.
export const experienceCard = (row: ExperienceRow): CardText => ({
  title: row.jobTitle,
  lines: [
    [row.company, employmentTypeLabel(row.employmentType)],
    [
      `${monthOf(row.startDate)} - ${row.endDate ? monthOf(row.endDate) : 'Present'}`,
      formatDuration(row.startDate, row.endDate),
    ],
  ],
});

// As the profile's Education card: a start alone is "Present", an end alone
// is shown alone (many CVs give only the year finished), no dates show nothing.
export const educationCard = (row: EducationRow): CardText => {
  const end = row.endDate ? monthOf(row.endDate) : undefined;
  const dates = row.startDate
    ? `${monthOf(row.startDate)} - ${end ?? 'Present'}`
    : end;
  return {
    title: row.fieldOfStudy
      ? `${row.degree} of ${row.fieldOfStudy}`
      : row.degree,
    lines: [
      [row.institution, dates],
      [row.grade ? `GPA: ${row.grade}` : undefined],
    ],
  };
};

// As the profile's Trainings card: "2022", "2022 - 2023", "2025 - Present".
export const trainingCard = (row: TrainingRow): CardText => {
  const start = yearOf(row.startDate);
  const end = row.endDate ? yearOf(row.endDate) : undefined;
  const years = row.isCurrentlyEnrolled
    ? `${start} - Present`
    : end && end !== start
      ? `${start} - ${end}`
      : `${start}`;
  return { title: row.courseName, lines: [[row.organizationName, years]] };
};

const ICONS = {
  experience: BriefcaseBusiness,
  education: GraduationCap,
} as const;

interface ImportCvRecordCardProps {
  id: string;
  text: CardText;
  /** The profile section's own icon; training cards have none, as designed. */
  icon?: keyof typeof ICONS;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/** One CV row as a card the candidate ticks to add it to their profile. */
export default function ImportCvRecordCard({
  id,
  text,
  icon,
  checked,
  disabled = false,
  onCheckedChange,
}: ImportCvRecordCardProps) {
  const Icon = icon ? ICONS[icon] : null;
  const lines = text.lines
    .map((parts) => parts.filter((part): part is string => Boolean(part)))
    .filter((parts) => parts.length > 0);

  return (
    <label
      htmlFor={id}
      className={cn(
        'flex items-start gap-spacing-xl sm:gap-spacing-2xl bg-bg-gray-soft-primary rounded-2xl border border-border-gray-secondary shadow-xs p-spacing-2xl sm:p-spacing-4xl transition-colors',
        disabled
          ? 'cursor-not-allowed'
          : 'cursor-pointer hover:border-border-brand-primary',
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        className="mt-0.5"
      />
      {Icon && (
        // Hidden on phones, where the text needs the width.
        <div className="hidden sm:flex size-12 shrink-0 rounded-full items-center justify-center bg-others-gray-gray-zero border border-others-gray-xlight">
          <Icon className="text-others-gray-default size-7" />
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-spacing-3xs">
        <p className="text-label-md font-label-md-strong! text-text-gray-primary break-words">
          {text.title}
        </p>
        {lines.map((parts, index) => (
          <div
            key={index}
            className="flex flex-wrap items-center gap-x-spacing-sm text-label-sm text-text-gray-tertiary"
          >
            {parts.map((part, index) => (
              <Dotted key={index} first={index === 0}>
                {part}
              </Dotted>
            ))}
          </div>
        ))}
      </div>
    </label>
  );
}

/** A fact, with the dot that separates it from the one before. */
function Dotted({ first, children }: { first: boolean; children: ReactNode }) {
  return (
    // One unit, so a wrapped line never ends or starts with a lone dot.
    <span className="inline-flex min-w-0 items-center gap-x-spacing-sm">
      {!first && (
        <span
          aria-hidden
          className="size-1.5 shrink-0 rounded-full bg-fg-gray-tertiary"
        />
      )}
      <span className="min-w-0 break-words">{children}</span>
    </span>
  );
}
