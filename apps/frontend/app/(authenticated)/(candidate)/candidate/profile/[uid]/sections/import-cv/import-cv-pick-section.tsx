'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  CvProfileImport,
  CvRecordCounts,
  CvRecords,
} from '@/services/cv/cv.type';

type CvProfile = CvProfileImport['profile'];
type CvProfileKey = keyof CvProfile;
type CvSectionKey = keyof CvRecords;
export type PickKey = CvProfileKey | CvSectionKey;

// What the import can put into the edit form, labelled as the form labels it.
const FORM_FIELDS: [CvProfileKey, string][] = [
  ['name', 'Applicant name'],
  ['jobTitle', 'Job titles'],
  ['summary', 'Description'],
  ['address', 'Address'],
  ['contactNumber', 'Contact number'],
  ['industry', 'Industries'],
  ['workMode', 'Work modes'],
  ['experienceLevel', 'Experience level'],
  ['skills', 'Skills'],
  ['interests', 'Interests'],
];

// The profile sections a CV's rows are added to.
const SECTIONS: [CvSectionKey, string][] = [
  ['experience', 'Work experience'],
  ['education', 'Education'],
  ['training', 'Training'],
];

const GROUPS = [
  {
    group: 'fields',
    title: 'Profile details',
    note: 'Go into your profile form. Press Save there to keep them.',
  },
  {
    group: 'sections',
    title: 'Experience, education and training',
    note: 'Added to your profile when you press Update profile. Nothing you already have is changed.',
  },
] as const;

// Every field left out is blank, which the edit form's applyCvImport skips.
const BLANK_PROFILE: CvProfile = {
  jobTitle: [],
  industry: [],
  workMode: [],
  experienceLevel: null,
  skills: [],
};

const hasValue = (value: unknown) =>
  Array.isArray(value) ? value.length > 0 : Boolean(value);

/** A profile value as a line of text: names for lists. */
const describe = (value: CvProfile[CvProfileKey]): string => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => ('skill' in entry ? entry.skill.name : entry.name))
      .join(', ');
  }
  if (value && typeof value === 'object') return value.name;
  return value ?? '';
};

/** Each CV row as a few words: "Senior Engineer at Acme". */
const describeRows = ({
  experience,
  education,
  training,
}: CvRecords): Record<CvSectionKey, string[]> => ({
  experience: experience.map((row) => `${row.jobTitle} at ${row.company}`),
  education: education.map((row) => `${row.degree}, ${row.institution}`),
  training: training.map(
    (row) => `${row.courseName} (${row.organizationName})`,
  ),
});

export interface PickItem {
  key: PickKey;
  group: (typeof GROUPS)[number]['group'];
  label: string;
  detail: string;
  /** Rows of this section the profile already has; they are left out. */
  alreadyOnProfile?: number;
  /** A section whose every row is already on the profile: nothing to add. */
  disabled?: boolean;
}

/**
 * Everything the CV gave, in list order: the fields it filled, then each
 * section it has rows for. A section with only rows the profile already has is
 * listed, disabled, so its absence from the choices is explained.
 */
export const pickItems = (result: CvProfileImport): PickItem[] => {
  const rows = describeRows(result.records);
  return [
    ...FORM_FIELDS.filter(([key]) => hasValue(result.profile[key])).map(
      ([key, label]): PickItem => ({
        key,
        group: 'fields',
        label,
        detail: describe(result.profile[key]),
      }),
    ),
    ...SECTIONS.filter(
      ([key]) => rows[key].length > 0 || result.alreadyOnProfile[key] > 0,
    ).map(
      ([key, label]): PickItem => ({
        key,
        group: 'sections',
        label,
        detail: rows[key].join(' · '),
        alreadyOnProfile: result.alreadyOnProfile[key],
        disabled: rows[key].length === 0,
      }),
    ),
  ];
};

/** The items that can be ticked: all but sections with nothing new. */
export const pickableKeys = (items: PickItem[]) =>
  items.filter((item) => !item.disabled).map(({ key }) => key);

/** The ticked items, split into what fills the form and what is saved now. */
export const pickedImport = (
  result: CvProfileImport,
  picked: PickKey[],
): { profile: CvProfile; records: CvRecords } => ({
  profile: {
    ...BLANK_PROFILE,
    ...Object.fromEntries(
      FORM_FIELDS.filter(([key]) => picked.includes(key)).map(([key]) => [
        key,
        result.profile[key],
      ]),
    ),
  },
  records: {
    experience: picked.includes('experience') ? result.records.experience : [],
    education: picked.includes('education') ? result.records.education : [],
    training: picked.includes('training') ? result.records.training : [],
  },
});

/** "2 work experience, 1 training", from what a save reports it added. */
export const describeAdded = (added: CvRecordCounts) =>
  SECTIONS.flatMap(([key, label]) =>
    added[key] ? [`${added[key]} ${label.toLowerCase()}`] : [],
  ).join(', ');

interface ImportCvPickSectionProps {
  items: PickItem[];
  picked: PickKey[];
  onChange: (picked: PickKey[]) => void;
  /** While saving: nothing can be changed. */
  disabled?: boolean;
}

/** One tick box per item the CV gave, grouped by when it is saved. */
export default function ImportCvPickSection({
  items,
  picked,
  onChange,
  disabled = false,
}: ImportCvPickSectionProps) {
  const pickable = pickableKeys(items);
  const allPicked = pickable.every((key) => picked.includes(key));

  const toggle = (key: PickKey, checked: boolean) =>
    onChange(
      checked ? [...picked, key] : picked.filter((other) => other !== key),
    );

  return (
    <div className="w-full rounded-xl border border-border-gray-secondary/60 bg-bg-gray-soft-secondary/70 text-left">
      <div className="flex items-center justify-between gap-spacing-xl px-spacing-xl py-spacing-lg border-b border-border-gray-secondary/60">
        <p className="text-label-sm font-label-sm-strong! text-text-gray-secondary">
          Found in your CV
        </p>
        {pickable.length > 0 && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(allPicked ? [] : pickable)}
            className="text-label-sm font-label-sm-strong! text-text-brand-secondary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            {allPicked ? 'Clear all' : 'Select all'}
          </button>
        )}
      </div>

      <div className="divide-y divide-border-gray-secondary/60">
        {GROUPS.map(({ group, title, note }) => {
          const groupItems = items.filter((item) => item.group === group);
          if (!groupItems.length) return null;

          return (
            <div
              key={group}
              className="px-spacing-xl py-spacing-lg space-y-spacing-lg"
            >
              <div>
                <p className="text-label-sm font-label-sm-strong! text-text-gray-secondary">
                  {title}
                </p>
                <p className="text-label-xs text-text-gray-tertiary">{note}</p>
              </div>

              {/* Two columns from tablet width up, so the list fits without scrolling. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-spacing-3xl gap-y-spacing-xl">
                {groupItems.map((item) => {
                  const id = `cv-import-${item.key}`;
                  return (
                    <div
                      key={item.key}
                      className="flex items-start gap-spacing-lg"
                    >
                      <Checkbox
                        id={id}
                        checked={picked.includes(item.key)}
                        disabled={disabled || item.disabled}
                        onCheckedChange={(checked) =>
                          toggle(item.key, checked === true)
                        }
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor={id}
                        className="min-w-0 flex-1 flex-col items-start gap-0.5 leading-normal cursor-pointer"
                      >
                        <span className="text-label-sm font-label-sm-strong! text-text-gray-primary">
                          {item.label}
                        </span>
                        {item.detail && (
                          <span className="text-label-xs font-normal text-text-gray-tertiary line-clamp-2 break-words">
                            {item.detail}
                          </span>
                        )}
                        {item.alreadyOnProfile ? (
                          <span className="text-label-xs font-normal text-text-gray-quaternary">
                            {item.disabled
                              ? `All ${item.alreadyOnProfile} already on your profile`
                              : `${item.alreadyOnProfile} more already on your profile, left out`}
                          </span>
                        ) : null}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
