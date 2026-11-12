'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmptyBox from '@/components/empty-box';
import { cn } from '@/lib/utils';
import {
  CvProfileImport,
  CvRecordCounts,
  CvRecords,
} from '@/services/cv/cv.type';
import ImportCvRecordCard, {
  educationCard,
  experienceCard,
  trainingCard,
} from './import-cv-record-card';
import type { SummaryGroup } from './import-cv-done-section';

type CvProfile = CvProfileImport['profile'];
type CvProfileKey = keyof CvProfile;
type CvSectionKey = keyof CvRecords;

/**
 * What is ticked: profile fields by key, and each section's CV rows by their
 * place in `records`.
 */
export type Picked = { fields: CvProfileKey[] } & Record<
  CvSectionKey,
  number[]
>;

// What the import can put into the edit form, in the design's order and words.
// Address and work mode are not in the design but the import fills them, so
// they stay.
const FORM_FIELDS: [CvProfileKey, string][] = [
  ['name', 'Applicant Name'],
  ['jobTitle', 'Job Title'],
  ['summary', 'Description'],
  ['contactNumber', 'Contact Number'],
  ['address', 'Address'],
  ['industry', 'Industry'],
  ['skills', 'Skills'],
  ['interests', 'Interest'],
  ['workMode', 'Work Mode'],
  ['experienceLevel', 'Experience level'],
];

// The profile sections a CV's rows are added to, one tab each.
const SECTIONS: {
  key: CvSectionKey;
  tab: string;
  noun: string;
  icon?: 'experience' | 'education';
}[] = [
  {
    key: 'experience',
    tab: 'Work Experience',
    noun: 'work experience',
    icon: 'experience',
  },
  {
    key: 'education',
    tab: 'Education Qualification',
    noun: 'education',
    icon: 'education',
  },
  { key: 'training', tab: 'Trainings', noun: 'training' },
];

// Every field left out is blank, which the edit form's applyCvImport skips.
const BLANK_PROFILE: CvProfile = {
  jobTitle: [],
  industry: [],
  workMode: [],
  experienceLevel: null,
  skills: [],
};

// How many names of a list are written out before "and 5 others".
const LIST_SHOWN = 4;

const hasValue = (value: unknown) =>
  Array.isArray(value) ? value.length > 0 : Boolean(value);

const describeList = (names: string[]) => {
  const rest = names.length - LIST_SHOWN;
  if (rest <= 0) return names.join(', ');
  return `${names.slice(0, LIST_SHOWN).join(', ')} and ${rest} ${rest === 1 ? 'other' : 'others'}`;
};

/** A profile value as a line of text: names for lists. */
const describe = (value: CvProfile[CvProfileKey]): string => {
  if (Array.isArray(value)) {
    return describeList(
      value.map((entry) => ('skill' in entry ? entry.skill.name : entry.name)),
    );
  }
  if (value && typeof value === 'object') return value.name;
  return value ?? '';
};

/** The form fields the CV gave a value for. */
const profileFields = (result: CvProfileImport) =>
  FORM_FIELDS.filter(([key]) => hasValue(result.profile[key]));

const indexes = (rows: unknown[]) => rows.map((_, index) => index);

const pickRows = <T,>(rows: T[], picked: number[]) =>
  rows.filter((_, index) => picked.includes(index));

/** Everything the CV gave, ticked: how the list starts. */
export const pickAll = (result: CvProfileImport): Picked => ({
  fields: profileFields(result).map(([key]) => key),
  experience: indexes(result.records.experience),
  education: indexes(result.records.education),
  training: indexes(result.records.training),
});

export const countPicked = ({
  fields,
  experience,
  education,
  training,
}: Picked) =>
  fields.length + experience.length + education.length + training.length;

/** The ticked items, split into what fills the form and what is saved now. */
export const pickedImport = (
  result: CvProfileImport,
  picked: Picked,
): { profile: CvProfile; records: CvRecords } => ({
  profile: {
    ...BLANK_PROFILE,
    ...Object.fromEntries(
      FORM_FIELDS.filter(([key]) => picked.fields.includes(key)).map(
        ([key]) => [key, result.profile[key]],
      ),
    ),
  },
  records: {
    experience: pickRows(result.records.experience, picked.experience),
    education: pickRows(result.records.education, picked.education),
    training: pickRows(result.records.training, picked.training),
  },
});

/**
 * What "Update Profile" did, by tab, for the closing summary. `added` is what
 * the save reports, or null when no rows were sent. The save skips a row that
 * reached the profile after the import (another tab, say), so fewer may be
 * added than were ticked; that is noted, as which ones is not known.
 */
export const pickedSummary = (
  result: CvProfileImport,
  picked: Picked,
  added: CvRecordCounts | null,
): SummaryGroup[] => {
  const { records } = pickedImport(result, picked);
  const rows: Record<CvSectionKey, string[]> = {
    experience: records.experience.map(
      (row) => `${row.jobTitle} at ${row.company}`,
    ),
    education: records.education.map(
      (row) => `${row.degree}, ${row.institution}`,
    ),
    training: records.training.map((row) => row.courseName),
  };

  return [
    {
      title: 'About',
      items: FORM_FIELDS.filter(([key]) => picked.fields.includes(key)).map(
        ([, label]) => label,
      ),
      // Unlike the rows, these are not saved yet.
      note: picked.fields.length
        ? 'Filled into your profile form. Press Save there to keep them.'
        : undefined,
    },
    ...SECTIONS.map(({ key, tab }) => {
      const skipped = rows[key].length - (added?.[key] ?? 0);
      return {
        title: tab,
        items: rows[key],
        note:
          skipped > 0
            ? `${skipped} of these ${skipped === 1 ? 'was' : 'were'} already on your profile.`
            : undefined,
      };
    }),
  ];
};

const toggleIn = <V,>(list: V[], value: V, checked: boolean) =>
  checked ? [...list, value] : list.filter((other) => other !== value);

interface ImportCvPickSectionProps {
  result: CvProfileImport;
  picked: Picked;
  onChange: (picked: Picked) => void;
  /** While saving: nothing can be changed. */
  disabled?: boolean;
}

/**
 * "Update Profile from CV": a tab per profile section, with a tick for each
 * field or row the CV gave.
 */
export default function ImportCvPickSection({
  result,
  picked,
  onChange,
  disabled = false,
}: ImportCvPickSectionProps) {
  const [tab, setTab] = useState<'about' | CvSectionKey>('about');
  const all = pickAll(result);
  const fields = profileFields(result);
  const cards = {
    experience: result.records.experience.map(experienceCard),
    education: result.records.education.map(educationCard),
    training: result.records.training.map(trainingCard),
  };

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as typeof tab)}
      className="w-full gap-spacing-3xl text-left"
    >
      <TabsList className="w-full h-11 justify-start bg-bg-gray-soft-secondary border border-border-gray-secondary rounded-xl overflow-x-auto">
        {[{ key: 'about', tab: 'About' }, ...SECTIONS].map(
          ({ key, tab: label }) => (
            <TabsTrigger
              key={key}
              value={key}
              className="flex-0 px-spacing-lg text-label-md font-label-md-strong! text-text-gray-quaternary data-[state=active]:bg-bg-gray-soft-primary data-[state=active]:text-text-gray-secondary data-[state=active]:shadow-sm"
            >
              {label}
            </TabsTrigger>
          ),
        )}
      </TabsList>

      <TabsContent value="about" className="space-y-spacing-3xl">
        {fields.length ? (
          <>
            <TabHeader
              anyPicked={picked.fields.length > 0}
              disabled={disabled}
              onToggle={() =>
                onChange({
                  ...picked,
                  fields: picked.fields.length ? [] : all.fields,
                })
              }
            />
            {/* Two columns from tablet width up, as designed. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-spacing-3xl gap-y-spacing-3xl">
              {fields.map(([key, label]) => {
                const id = `cv-import-${key}`;
                const value = result.profile[key];
                const detail = describe(value);
                return (
                  <div key={key} className="flex items-start gap-spacing-lg">
                    <Checkbox
                      id={id}
                      checked={picked.fields.includes(key)}
                      disabled={disabled}
                      onCheckedChange={(checked) =>
                        onChange({
                          ...picked,
                          fields: toggleIn(
                            picked.fields,
                            key,
                            checked === true,
                          ),
                        })
                      }
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor={id}
                      className="min-w-0 flex-1 flex-col items-start gap-0.5 leading-normal cursor-pointer"
                    >
                      <span className="text-label-md font-label-md-strong! text-text-gray-secondary">
                        {label}
                      </span>
                      {/* Lists wrap to two lines; written text keeps to one. */}
                      <span
                        title={detail}
                        className={cn(
                          'text-label-md font-normal text-text-gray-tertiary break-words',
                          Array.isArray(value)
                            ? 'line-clamp-2'
                            : 'line-clamp-1',
                        )}
                      >
                        {detail}
                      </span>
                    </Label>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <EmptyBox
            title="No profile details yet!"
            description="Your CV has nothing to add to the About section."
          />
        )}
      </TabsContent>

      {SECTIONS.map(({ key, noun, icon }) => {
        const already = result.alreadyOnProfile[key];
        return (
          <TabsContent key={key} value={key} className="space-y-spacing-3xl">
            {cards[key].length ? (
              <>
                <TabHeader
                  anyPicked={picked[key].length > 0}
                  disabled={disabled}
                  onToggle={() =>
                    onChange({
                      ...picked,
                      [key]: picked[key].length ? [] : all[key],
                    })
                  }
                />
                <div className="space-y-spacing-2xl">
                  {cards[key].map((text, index) => (
                    <ImportCvRecordCard
                      key={index}
                      id={`cv-import-${key}-${index}`}
                      text={text}
                      icon={icon}
                      checked={picked[key].includes(index)}
                      disabled={disabled}
                      onCheckedChange={(checked) =>
                        onChange({
                          ...picked,
                          [key]: toggleIn(picked[key], index, checked),
                        })
                      }
                    />
                  ))}
                </div>
                {already > 0 && (
                  <p className="text-label-sm text-text-gray-quaternary">
                    {already} more from your CV {already === 1 ? 'is' : 'are'}{' '}
                    already on your profile, so{' '}
                    {already === 1 ? 'it is' : 'they are'} left out.
                  </p>
                )}
              </>
            ) : (
              <EmptyBox
                title={`No ${noun} yet!`}
                description={
                  already
                    ? `All ${already} from your CV ${already === 1 ? 'is' : 'are'} already on your profile.`
                    : `Your CV has no ${noun} to add.`
                }
              />
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}

/** A tab's heading, with its own "Clear All" (or "Select All" once cleared). */
function TabHeader({
  anyPicked,
  disabled,
  onToggle,
}: {
  anyPicked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-spacing-xl">
      <p className="text-label-md font-label-md-strong! text-text-gray-secondary">
        Check in the information you want to update
      </p>
      <button
        type="button"
        disabled={disabled}
        onClick={onToggle}
        className="shrink-0 text-label-sm font-label-sm-strong! text-text-brand-secondary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      >
        {anyPicked ? 'Clear All' : 'Select All'}
      </button>
    </div>
  );
}
