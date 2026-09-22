'use client';

import React, { useEffect, useMemo, useState } from 'react';
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';

import { Label } from '@/components/ui/label';
import { MailIcon } from 'lucide-react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import {
  Control,
  Controller,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';
import { cn } from '@/lib/utils';
import { INDUSTRY_ENUMS, TENANT_TYPE } from '@rl/types';
import LocationSelector from '@/components/location-selector';
import {
  JobProfileUpdateInput,
  JobTitle,
} from '@/services/job-profile/job-profile.type';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import { useDebounce } from '@/hooks/useDebounce';
import { useJobTitles } from '@/services/job-title/job-title.client';
import { MAX_JOB_TITLES_STEP_SELECTION } from '@/services/job-title/job-title.validation';
import { JobTitleData } from '@/services/job-title/job-title.type';
import { IndustryData } from '@/services/industry/industry.type';
import { WorkModeData } from '@/services/work-mode/work-mode.type';
import { useIndustries } from '@/services/industry/industry.client';
import { useWorkModes } from '@/services/work-mode/work-mode.client';
import { MAX_INDUSTRIES_STEP_SELECTION } from '@/services/industry/industry.validation';
import { MAX_WORK_MODES_STEP_SELECTION } from '@/services/work-mode/work-mode.validation';
import { useExperienceLevels } from '@/services/experience-level';
import {
  usePageAction,
  usePageContext,
} from '@/components/ai-chat/page-context';
import { useCatalogPageAction } from '@/components/ai-chat/use-catalog-page-action';
import { excerpt } from '@/components/ai-chat/page-state';
import { AGENT_STAGGER_MS, prefersReducedMotion, wait } from '@/lib/motion';
import { SelectItem, SelectValue } from '@/components/ui/select';
import {
  Select,
  SelectTrigger,
  SelectGroup,
  SelectContent,
} from '@/components/ui/select';

export const ORG_TYPE_OPTIONS = [
  { label: 'Private', value: TENANT_TYPE.PRIVATE },
  { label: 'Public', value: TENANT_TYPE.PUBLIC },
];

export const TENANT_INDUSTRY_OPTIONS = [
  { label: 'Technology', value: INDUSTRY_ENUMS.TECHNOLOGY },
  { label: 'Finance', value: INDUSTRY_ENUMS.FINANCE },
  { label: 'Healthcare', value: INDUSTRY_ENUMS.HEALTHCARE },
  { label: 'Education', value: INDUSTRY_ENUMS.EDUCATION },
  { label: 'Manufacturing', value: INDUSTRY_ENUMS.MANUFACTURING },
  { label: 'Retail', value: INDUSTRY_ENUMS.RETAIL },
  { label: 'Hospitality', value: INDUSTRY_ENUMS.HOSPITALITY },
  { label: 'Construction', value: INDUSTRY_ENUMS.CONSTRUCTION },
  { label: 'Transportation', value: INDUSTRY_ENUMS.TRANSPORTATION },
  { label: 'Energy', value: INDUSTRY_ENUMS.ENERGY },
];

/**
 * The written fields Alice may fill in, and the limits she must respect.
 *
 * `email` and `visibility` are deliberately absent, for the reasons given on
 * `update_my_profile` in the backend: email is an identity field, and who can
 * see the profile is not a thing to change as a side effect of a chat.
 *
 * The caps mirror the form's own yup schema where it has one (`name`) and are
 * otherwise a sanity bound — the point is to reject a runaway value before it
 * lands in an input the user then has to clear by hand.
 */
const FILLABLE_FIELDS = [
  { key: 'name', label: 'display name', max: 50 },
  { key: 'summary', label: 'summary', max: 2000 },
  { key: 'address', label: 'location', max: 200 },
  { key: 'contactNumber', label: 'contact number', max: 30 },
  { key: 'portfolioUrl', label: 'portfolio URL', max: 300 },
  { key: 'skills', label: 'skills', max: 1000 },
  { key: 'interests', label: 'interests', max: 1000 },
] as const;

type FillableKey = (typeof FILLABLE_FIELDS)[number]['key'];

/**
 * Validates what Alice sent before any of it reaches the form.
 *
 * Throws rather than dropping a bad field: the message is shown to the user, and
 * a silent drop would leave Alice reporting that she filled in something the
 * user cannot see.
 */
const parseProfileFields = (args: Record<string, unknown>) => {
  const filled: { key: FillableKey; label: string; value: string }[] = [];

  for (const field of FILLABLE_FIELDS) {
    const raw = args[field.key];
    if (raw === undefined || raw === null) continue;

    if (typeof raw !== 'string') {
      throw new Error(
        `Alice's ${field.label} wasn't usable. Ask her to try again.`,
      );
    }

    const value = raw.trim();
    if (!value) continue;

    if (value.length > field.max) {
      throw new Error(
        `Alice's ${field.label} is too long — the limit is ${field.max} characters.`,
      );
    }

    if (field.key === 'portfolioUrl' && !/^https?:\/\/\S+$/i.test(value)) {
      throw new Error(
        "Alice's portfolio URL wasn't a full web address. Ask her to try again.",
      );
    }

    filled.push({ key: field.key, label: field.label, value });
  }

  return filled;
};

type EditProfileProps = {
  register: UseFormRegister<JobProfileUpdateInput>;
  control: Control<JobProfileUpdateInput>;
  errors: FieldErrors<JobProfileUpdateInput>;
  existingJobTitles?: JobTitleData[];
  existingIndustries?: IndustryData[];
  existingWorkModes?: WorkModeData[];
  setValue: UseFormSetValue<JobProfileUpdateInput>;
  watch: UseFormWatch<JobProfileUpdateInput>;
};

export default function EditProfile({
  register,
  control,
  errors,
  existingJobTitles = [],
  existingIndustries = [],
  existingWorkModes = [],
  setValue,
  watch,
}: EditProfileProps) {
  const jobTitleAnchor = useComboboxAnchor();
  const industryAnchor = useComboboxAnchor();
  const workModeAnchor = useComboboxAnchor();
  const experienceLevelAnchor = useComboboxAnchor();

  const [savedJobTitles, setSavedJobTitles] = useState<JobTitleData[]>([]);
  const [savedIndustries, setSavedIndustries] = useState<IndustryData[]>([]);
  const [savedWorkModes, setSavedWorkModes] = useState<WorkModeData[]>([]);

  const [search, setSearch] = useState('');
  const [searchIndustries, setSearchIndustries] = useState('');
  const [searchWorkModes, setSearchWorkModes] = useState('');

  const debouncedSearch = useDebounce(search, 500);
  const debouncedSearchIndustries = useDebounce(searchIndustries, 500);
  const debouncedSearchWorkModes = useDebounce(searchWorkModes, 500);

  useEffect(() => {
    setSavedJobTitles(existingJobTitles);
  }, [existingJobTitles]);

  useEffect(() => {
    setSavedIndustries(existingIndustries);
  }, [existingIndustries]);

  useEffect(() => {
    setSavedWorkModes(existingWorkModes);
  }, [existingWorkModes]);

  const { jobTitles, isLoading, isFetching } = useJobTitles({
    limit: 20,
    clientSearch: debouncedSearch || undefined,
  });

  const {
    industries,
    isLoading: isLoadingIndustries,
    isFetching: isFetchingIndustries,
  } = useIndustries({
    limit: 20,
    clientSearch: debouncedSearchIndustries || undefined,
  });

  const {
    workModes,
    isLoading: isLoadingWorkModes,
    isFetching: isFetchingWorkModes,
  } = useWorkModes({
    limit: 20,
    clientSearch: debouncedSearchWorkModes || undefined,
  });

  const {
    experienceLevels,
    isLoading: isLoadingExperienceLevels,
    isFetching: isFetchingExperienceLevels,
  } = useExperienceLevels({
    limit: 20,
  });

  const selectedExperienceLevel = watch('experienceLevel');

  /**
   * Alice's view of this form, and what she may fill in on it.
   *
   * The four catalog fields reuse the onboarding hook, so an id she passes is
   * checked against the real catalog on the server before it ever reaches the
   * browser. They pass `registerContext: false` because all four are on this one
   * page: the context below covers the whole form instead, and only the last
   * context registered is sent.
   *
   * Nothing here saves. Every action sets form state and stops; the user reads
   * the form and presses Save, which runs the same authorized update as always.
   *
   * The text fields go in as excerpts, not in full. The server caps a page state
   * at 2,000 serialized characters and rejects the whole request over it, and a
   * filled-in summary, skills and interests together run past that on their own.
   * An excerpt is enough for what Alice needs it for — knowing whether a field
   * is filled and roughly what it says — and `length` carries the rest.
   */
  usePageContext({
    page: 'candidate.profile.edit',
    summary:
      "The user's own candidate profile, with the edit form open. They press Save to store " +
      'any changes, or Cancel to discard them.',
    state: {
      editing: true,
      name: excerpt(watch('name')),
      summary: excerpt(watch('summary')),
      address: excerpt(watch('address')),
      contactNumber: excerpt(watch('contactNumber')),
      portfolioUrl: excerpt(watch('portfolioUrl')),
      skills: excerpt(watch('skills')),
      interests: excerpt(watch('interests')),
      jobTitles: savedJobTitles.map((option) => option.name),
      industries: savedIndustries.map((option) => option.name),
      workModes: savedWorkModes.map((option) => option.name),
      experienceLevel:
        experienceLevels.find((level) => level._id === selectedExperienceLevel)
          ?.name ?? null,
      limits: {
        jobTitles: MAX_JOB_TITLES_STEP_SELECTION,
        industries: MAX_INDUSTRIES_STEP_SELECTION,
        workModes: MAX_WORK_MODES_STEP_SELECTION,
      },
    },
  });

  useCatalogPageAction({
    kind: 'job_title',
    registerContext: false,
    saveButton: 'Save',
    label: 'job titles',
    max: MAX_JOB_TITLES_STEP_SELECTION,
    selected: savedJobTitles,
    apply: (options) => {
      setValue(
        'jobTitle',
        options.map((option) => option._id),
        { shouldDirty: true, shouldTouch: true },
      );
      setSavedJobTitles(
        options.map((option) => ({ _id: option._id, name: option.name })),
      );
    },
  });

  useCatalogPageAction({
    kind: 'industry',
    registerContext: false,
    saveButton: 'Save',
    label: 'industries',
    max: MAX_INDUSTRIES_STEP_SELECTION,
    selected: savedIndustries,
    apply: (options) => {
      setValue(
        'industry',
        options.map((option) => option._id),
        { shouldDirty: true, shouldTouch: true },
      );
      setSavedIndustries(
        options.map((option) => ({ _id: option._id, name: option.name })),
      );
    },
  });

  useCatalogPageAction({
    kind: 'work_mode',
    registerContext: false,
    saveButton: 'Save',
    label: 'work modes',
    max: MAX_WORK_MODES_STEP_SELECTION,
    selected: savedWorkModes,
    apply: (options) => {
      setValue(
        'workMode',
        options.map((option) => option._id),
        { shouldDirty: true, shouldTouch: true },
      );
      setSavedWorkModes(
        options.map((option) => ({ _id: option._id, name: option.name })),
      );
    },
  });

  useCatalogPageAction({
    kind: 'experience_level',
    registerContext: false,
    saveButton: 'Save',
    label: 'experience levels',
    max: 1,
    // The whole list is loaded for the dropdown, so an id outside it is
    // rejected here as well as on the server.
    knownIds: experienceLevels.map((level) => level._id),
    selected: experienceLevels.filter(
      (level) => level._id === selectedExperienceLevel,
    ),
    apply: (options) => {
      setValue('experienceLevel', options[0]._id, {
        shouldDirty: true,
        shouldTouch: true,
      });
    },
  });

  usePageAction({
    name: 'fill_profile_fields',
    description:
      "Fill in the written fields on the user's open profile form: display name, summary, " +
      'location, contact number, portfolio URL, skills or interests. Pass only the fields being ' +
      'changed — anything left out keeps its current value. Use what the user told you; do not ' +
      'invent details about them. This does not save; the user presses Save.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Display name, up to 50 characters.',
        },
        summary: {
          type: 'string',
          description: 'A short professional summary, written in their voice.',
        },
        address: {
          type: 'string',
          description: 'City and country, or state and country.',
        },
        contactNumber: { type: 'string', description: 'Phone number.' },
        portfolioUrl: {
          type: 'string',
          description: 'Full URL including https://.',
        },
        skills: { type: 'string', description: 'Their skills, as prose.' },
        interests: {
          type: 'string',
          description: 'Their interests, as prose.',
        },
      },
    },
    handler: async (args) => {
      const filled = parseProfileFields(args);

      if (filled.length === 0) {
        throw new Error(
          "Alice didn't send anything to fill in. Try asking again.",
        );
      }

      for (const [index, field] of filled.entries()) {
        setValue(field.key, field.value, {
          shouldDirty: true,
          shouldTouch: true,
        });
        if (index < filled.length - 1 && !prefersReducedMotion()) {
          await wait(AGENT_STAGGER_MS);
        }
      }

      return `Filled in ${filled.map((field) => field.label).join(', ')}.`;
    },
  });

  return (
    <div className=" space-y-spacing-4xl">
      <div className=" space-y-spacing-2xl">
        <h4 className=" text-text-gray-primary text-label-xl font-label-xl-strong!">
          About
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-spacing-2xl">
          <div className="space-y-spacing-xs">
            <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
              Applicant Name
            </Label>
            <div className=" space-y-spacing-sm">
              <InputGroup
                className={cn(
                  'h-10 rounded-lg shadow-xs border-border-gray-primary',
                  errors.name && ' border-border-error-primary',
                )}
              >
                <InputGroupInput
                  type="text"
                  placeholder=" Eg . John Doe"
                  className=" text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                  {...register('name')}
                />
              </InputGroup>
              {errors.name && (
                <p className="text-xs text-text-error-primary">
                  {errors.name.message}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-spacing-xs">
            <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
              Job Title
            </Label>
            <div className=" space-y-spacing-sm">
              <Controller
                control={control}
                name="jobTitle"
                render={({ field }) => {
                  const selectedTitles = (field.value ?? []).filter(
                    (id): id is string => Boolean(id),
                  );

                  return (
                    <Combobox
                      multiple
                      items={jobTitles}
                      autoHighlight
                      filter={null}
                      value={selectedTitles}
                      onValueChange={(jobTitle) => {
                        console.log('jobTitle', jobTitle);

                        const nextIds = jobTitle.slice(
                          0,
                          MAX_JOB_TITLES_STEP_SELECTION,
                        );
                        field.onChange(nextIds);
                        setSavedJobTitles((prev: JobTitleData[]) => {
                          const selected = prev.filter((item) =>
                            nextIds.includes(item._id),
                          );

                          // Add newly selected items
                          const newItems = jobTitles.filter(
                            (item) =>
                              nextIds.includes(item._id) &&
                              !selected.some(
                                (selectedItem) => selectedItem._id === item._id,
                              ),
                          );

                          return [...selected, ...newItems];
                        });
                      }}
                      onInputValueChange={(value) => {
                        setSearch(value);
                      }}
                    >
                      <ComboboxChips
                        ref={jobTitleAnchor}
                        className={cn(
                          'w-full focus-within:ring-0! min-h-10! rounded-lg shadow-xs border border-border-gray-primary data-placeholder:text-text-gray-quaternary text-text-gray-secondary text-label-sm font-label-sm-strong!',
                          errors.jobTitle && 'border-border-error-primary',
                        )}
                      >
                        <ComboboxValue>
                          {(values: string[]) => (
                            <>
                              {values.map((value) => {
                                const option = savedJobTitles?.find(
                                  (item) => item._id === value,
                                );

                                return (
                                  <ComboboxChip
                                    key={value}
                                    className="bg-bg-gray-soft-primary border border-border-gray-primary rounded-md"
                                  >
                                    <span className=" inline-block max-w-[120px] truncate">
                                      {option?.name}
                                    </span>
                                  </ComboboxChip>
                                );
                              })}

                              <ComboboxChipsInput
                                placeholder={
                                  !values.length ? 'Search job title...' : ''
                                }
                              />
                            </>
                          )}
                        </ComboboxValue>
                      </ComboboxChips>

                      <ComboboxContent
                        anchor={jobTitleAnchor}
                        className="bg-bg-gray-soft-primary ring-border-gray-primary!"
                      >
                        <ComboboxEmpty>
                          {isLoading || isFetching
                            ? 'Loading...'
                            : 'No job titles found.'}
                        </ComboboxEmpty>
                        <ComboboxList>
                          {(item: JobTitle) => (
                            <ComboboxItem
                              key={item._id}
                              value={item._id}
                              disabled={
                                selectedTitles.length >=
                                  MAX_JOB_TITLES_STEP_SELECTION &&
                                !selectedTitles.includes(item._id)
                              }
                            >
                              {item.name}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  );
                }}
              />
              {errors.jobTitle && (
                <p className="text-xs text-text-error-primary">
                  {errors.jobTitle.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-spacing-xs sm:col-span-2">
            <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
              Description of yourself
            </Label>
            <div className=" space-y-spacing-sm ">
              <InputGroup className="rounded-lg shadow-xs border-border-gray-primary">
                <InputGroupTextarea
                  placeholder="Eg. I am a software engineer with 5 years of experience in React, Node.js, and MongoDB."
                  {...register('summary')}
                  className="min-h-[136px] text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                />
              </InputGroup>
              {errors.summary && (
                <p className="text-sm text-red-500">{errors.summary.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className=" space-y-spacing-2xl">
        <h4 className=" text-text-gray-primary text-label-xl font-label-xl-strong!">
          Contact and Address
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-spacing-2xl">
          <div className="space-y-spacing-xs sm:col-span-2">
            <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
              Address
            </Label>
            <div className=" space-y-spacing-sm">
              <Controller
                control={control}
                name="address"
                render={({ field }) => (
                  <LocationSelector
                    defaultValue={field.value}
                    onSelectLocation={(val) => {
                      field.onChange(val.address);
                    }}
                  />
                )}
              />
              {errors.address && (
                <p className="text-sm text-red-500">{errors.address.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-spacing-xs">
            <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
              Email Address
            </Label>
            <div className=" space-y-spacing-sm">
              <InputGroup className="h-10 rounded-lg shadow-xs border-border-gray-primary">
                <InputGroupInput
                  type="text"
                  placeholder="Eg. elena@example.com"
                  {...register('email')}
                  className="text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                />
                <InputGroupAddon>
                  <MailIcon className=" text-fg-gray-tertiary" />
                </InputGroupAddon>
              </InputGroup>
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-spacing-xs">
            <Label className="text-label-sm font-label-sm-strong! text-text-gray-secondary">
              Contact Number
            </Label>

            <div className=" space-y-spacing-sm">
              <Controller
                name="contactNumber"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    {...field}
                    defaultCountry="GB"
                    international
                    placeholder="Eg. +91 9876543210"
                    className=" border h-10 rounded-lg shadow-xs border-border-gray-primary w-full text-text-gray-primary"
                  />
                )}
              />
              {errors.contactNumber && (
                <p className="text-sm text-red-500">
                  {errors.contactNumber.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className=" space-y-spacing-2xl">
        <h4 className=" text-text-gray-primary text-label-xl font-label-xl-strong!">
          Career Preferences
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-spacing-2xl">
          <div className="space-y-spacing-xs sm:col-span-2">
            <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
              Interested Industry
            </Label>
            <div className=" space-y-spacing-sm">
              <Controller
                control={control}
                name="industry"
                render={({ field }) => {
                  const selectedIndustries = (field.value ?? []).filter(
                    (id): id is string => Boolean(id),
                  );

                  return (
                    <Combobox
                      multiple
                      items={industries}
                      autoHighlight
                      filter={null}
                      value={selectedIndustries}
                      onValueChange={(industry) => {
                        const nextIds = industry.slice(
                          0,
                          MAX_INDUSTRIES_STEP_SELECTION,
                        );
                        field.onChange(nextIds);
                        setSavedIndustries((prev: IndustryData[]) => {
                          const selected = prev.filter((item) =>
                            nextIds.includes(item._id),
                          );

                          // Add newly selected items
                          const newItems = industries.filter(
                            (item) =>
                              nextIds.includes(item._id) &&
                              !selected.some(
                                (selectedItem) => selectedItem._id === item._id,
                              ),
                          );

                          return [...selected, ...newItems];
                        });
                      }}
                      onInputValueChange={(value) => {
                        setSearchIndustries(value);
                      }}
                    >
                      <ComboboxChips
                        ref={industryAnchor}
                        className={cn(
                          'w-full focus-within:ring-0! min-h-10! rounded-lg shadow-xs border border-border-gray-primary data-placeholder:text-text-gray-quaternary text-text-gray-secondary text-label-sm font-label-sm-strong!',
                          errors.industry && 'border-border-error-primary',
                        )}
                      >
                        <ComboboxValue>
                          {(values: string[]) => (
                            <>
                              {values.map((value) => {
                                const option = savedIndustries?.find(
                                  (item) => item._id === value,
                                );

                                return (
                                  <ComboboxChip
                                    key={value}
                                    className="bg-bg-gray-soft-primary border border-border-gray-primary rounded-md"
                                  >
                                    <span className=" inline-block max-w-[120px] truncate">
                                      {option?.name}
                                    </span>
                                  </ComboboxChip>
                                );
                              })}

                              <ComboboxChipsInput
                                placeholder={
                                  !values.length ? 'Search industry...' : ''
                                }
                              />
                            </>
                          )}
                        </ComboboxValue>
                      </ComboboxChips>

                      <ComboboxContent
                        anchor={industryAnchor}
                        className="bg-bg-gray-soft-primary ring-border-gray-primary!"
                      >
                        <ComboboxEmpty>
                          {isLoading || isFetching
                            ? 'Loading...'
                            : 'No industries found.'}
                        </ComboboxEmpty>
                        <ComboboxList>
                          {(item: IndustryData) => (
                            <ComboboxItem
                              key={item._id}
                              value={item._id}
                              disabled={
                                selectedIndustries.length >=
                                  MAX_JOB_TITLES_STEP_SELECTION &&
                                !selectedIndustries.includes(item._id)
                              }
                            >
                              {item.name}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  );
                }}
              />
              {errors.industry && (
                <p className="text-xs text-text-error-primary">
                  {errors.industry.message}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-spacing-xs">
            <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
              Experience Level
            </Label>
            <div className=" space-y-spacing-sm">
              <Controller
                name="experienceLevel"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-10! w-full rounded-lg shadow-xs border-border-gray-primary text-text-gray-secondary text-label-md font-label-md-strong!">
                      <SelectValue placeholder="Choose your Experience Level" />
                    </SelectTrigger>

                    <SelectContent className=" bg-white">
                      <SelectGroup>
                        {experienceLevels.map((experienceLevel) => (
                          <SelectItem
                            key={experienceLevel._id}
                            value={experienceLevel._id}
                          >
                            {experienceLevel.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.jobTitle && (
                <p className="text-xs text-text-error-primary">
                  {errors.jobTitle.message}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-spacing-xs">
            <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
              Preferred Work Mode
            </Label>
            <div className=" space-y-spacing-sm">
              <Controller
                control={control}
                name="workMode"
                render={({ field }) => {
                  const selectedWorkModes = (field.value ?? []).filter(
                    (id): id is string => Boolean(id),
                  );

                  return (
                    <Combobox
                      multiple
                      items={workModes}
                      autoHighlight
                      filter={null}
                      value={selectedWorkModes}
                      onValueChange={(workMode) => {
                        const nextIds = workMode.slice(
                          0,
                          MAX_WORK_MODES_STEP_SELECTION,
                        );
                        field.onChange(nextIds);
                        setSavedWorkModes((prev: WorkModeData[]) => {
                          const selected = prev.filter((item) =>
                            nextIds.includes(item._id),
                          );

                          // Add newly selected items
                          const newItems = workModes.filter(
                            (item) =>
                              nextIds.includes(item._id) &&
                              !selected.some(
                                (selectedItem) => selectedItem._id === item._id,
                              ),
                          );

                          return [...selected, ...newItems];
                        });
                      }}
                      onInputValueChange={(value) => {
                        setSearchWorkModes(value);
                      }}
                    >
                      <ComboboxChips
                        ref={workModeAnchor}
                        className={cn(
                          'w-full focus-within:ring-0! min-h-10! rounded-lg shadow-xs border border-border-gray-primary data-placeholder:text-text-gray-quaternary text-text-gray-secondary text-label-sm font-label-sm-strong!',
                          errors.workMode && 'border-border-error-primary',
                        )}
                      >
                        <ComboboxValue>
                          {(values: string[]) => (
                            <>
                              {values.map((value) => {
                                const option = savedWorkModes?.find(
                                  (item) => item._id === value,
                                );

                                return (
                                  <ComboboxChip
                                    key={value}
                                    className="bg-bg-gray-soft-primary border border-border-gray-primary rounded-md"
                                  >
                                    <span className=" inline-block max-w-[120px] truncate">
                                      {option?.name}
                                    </span>
                                  </ComboboxChip>
                                );
                              })}

                              <ComboboxChipsInput
                                placeholder={
                                  !values.length ? 'Search work mode...' : ''
                                }
                              />
                            </>
                          )}
                        </ComboboxValue>
                      </ComboboxChips>

                      <ComboboxContent
                        anchor={workModeAnchor}
                        className="bg-bg-gray-soft-primary ring-border-gray-primary!"
                      >
                        <ComboboxEmpty>
                          {isLoading || isFetching
                            ? 'Loading...'
                            : 'No work modes found.'}
                        </ComboboxEmpty>
                        <ComboboxList>
                          {(item: WorkModeData) => (
                            <ComboboxItem
                              key={item._id}
                              value={item._id}
                              disabled={
                                selectedWorkModes.length >=
                                  MAX_JOB_TITLES_STEP_SELECTION &&
                                !selectedWorkModes.includes(item._id)
                              }
                            >
                              {item.name}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  );
                }}
              />
              {errors.workMode && (
                <p className="text-xs text-text-error-primary">
                  {errors.workMode.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className=" space-y-spacing-2xl">
        <h4 className=" text-text-gray-primary text-label-xl font-label-xl-strong!">
          Social & Professional Links
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-spacing-2xl">
          <div className="space-y-spacing-xs sm:col-span-2">
            <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
              Portfolio URL
            </Label>
            <div className=" space-y-spacing-sm">
              <InputGroup
                className={cn(
                  'h-10 rounded-lg shadow-xs border-border-gray-primary',
                  errors.portfolioUrl && ' border-border-error-primary',
                )}
              >
                <InputGroupInput
                  type="text"
                  placeholder=" Eg . https://your-portfolio.com"
                  className=" text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                  {...register('portfolioUrl')}
                />
              </InputGroup>
              {errors.portfolioUrl && (
                <p className="text-sm text-red-500">
                  {errors.portfolioUrl.message}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-spacing-xs sm:col-span-2">
            <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
              Skills
            </Label>
            <div className=" space-y-spacing-sm ">
              <InputGroup className="rounded-lg shadow-xs border-border-gray-primary">
                <InputGroupTextarea
                  placeholder="Eg. React, Node.js, MongoDB"
                  {...register('skills')}
                  className="min-h-[136px] text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                />
              </InputGroup>
              {errors.skills && (
                <p className="text-sm text-red-500">{errors.skills.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-spacing-xs sm:col-span-2">
            <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
              Interests
            </Label>
            <div className=" space-y-spacing-sm ">
              <InputGroup className="rounded-lg shadow-xs border-border-gray-primary">
                <InputGroupTextarea
                  placeholder="Eg. Traveling, Reading, Cooking"
                  {...register('interests')}
                  className="min-h-[136px] text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
                />
              </InputGroup>
              {errors.interests && (
                <p className="text-sm text-red-500">
                  {errors.interests.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
