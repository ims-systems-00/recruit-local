'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, ChevronRight, Info, Plus, Search, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import {
  JOB_VALUE_PRIORITY_ENUMS,
  JOB_VALUE_PRIORITY_LABELS,
  JOB_VALUE_PRIORITY_WEIGHT,
  JOB_VALUES_MAX_PER_TYPE,
  JOB_VALUES_MAX_TOTAL,
  VALUE_TYPE_ENUM,
  VALUE_TYPE_LABELS,
} from '@rl/types';
import { JobData } from '@/services/jobs/job.type';
import { useUpdateJob } from '@/services/jobs/jobs.client';
import { useTenant } from '@/services/tenants/tenants.client';
import { useValues } from '@/services/value/value.client';
import { ValueData } from '@/services/value/value.type';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { PriorityRanksDialog } from './modals/priority-ranks-dialog';
import { ValueCatalogueDialog } from './modals/value-catalogue-dialog';
import { usePageContext } from '@/components/ai-chat/page-context';
import { useValuesCategoryAction } from './values-potentials-fill';

// The value types, in the order the catalogue lists them.
const CATEGORIES: VALUE_TYPE_ENUM[] = [
  VALUE_TYPE_ENUM.MINDSET,
  VALUE_TYPE_ENUM.WORKING_STYLE,
  VALUE_TYPE_ENUM.CULTURE_AND_BEHAVIOR,
  VALUE_TYPE_ENUM.LEADERSHIP,
  VALUE_TYPE_ENUM.MOTIVATION,
];

// Highest first. Labels and weights come from JOB_VALUE_PRIORITY_LABELS /
// JOB_VALUE_PRIORITY_WEIGHT; only the badge style is this screen's own.
const PRIORITY_RANKS: {
  priority: JOB_VALUE_PRIORITY_ENUMS;
  badgeClass: string;
}[] = [
  {
    priority: JOB_VALUE_PRIORITY_ENUMS.ESSENTIAL,
    badgeClass: 'bg-bg-brand-solid-primary text-white font-semibold',
  },
  {
    priority: JOB_VALUE_PRIORITY_ENUMS.HIGHLY_IMPORTANT,
    badgeClass: 'bg-pink-100 text-pink-700 font-semibold',
  },
  {
    priority: JOB_VALUE_PRIORITY_ENUMS.IMPORTANT,
    badgeClass: 'bg-pink-50 text-pink-600 font-medium',
  },
  {
    priority: JOB_VALUE_PRIORITY_ENUMS.DESIRABLE,
    badgeClass:
      'bg-bg-gray-soft-secondary text-text-gray-secondary font-medium',
  },
];

const multiplierText = (priority: JOB_VALUE_PRIORITY_ENUMS) =>
  `x${JOB_VALUE_PRIORITY_WEIGHT[priority]}`;

// A selected value as this step edits it: the catalogue value, plus the
// priority the job gives it.
type ValueRow = {
  id: string;
  category: VALUE_TYPE_ENUM;
  name: string;
  priority: JOB_VALUE_PRIORITY_ENUMS;
};

interface ValuesPotentialsStepProps {
  defaultValues: JobData;
  prev: (data: Partial<JobData>) => void;
  next: (data: Partial<JobData>) => void;
}

export default function ValuesPotentialsStep({
  defaultValues,
  prev,
  next,
}: ValuesPotentialsStepProps) {
  const [selectedValues, setSelectedValues] = useState<ValueRow[]>(() =>
    (defaultValues.values ?? []).map(({ value, priority }) => ({
      id: value._id,
      category: value.type,
      name: value.label,
      // Always present here: priorities are hidden from candidates and the
      // public only, and this step is the job's own employer.
      priority: priority ?? JOB_VALUE_PRIORITY_ENUMS.ESSENTIAL,
    })),
  );
  const [error, setError] = useState<string | null>(null);

  const { updateJob, isPending } = useUpdateJob();

  const [activeCategory, setActiveCategory] = useState<VALUE_TYPE_ENUM>(
    VALUE_TYPE_ENUM.MINDSET,
  );
  const [categorySearchQuery, setCategorySearchQuery] = useState<
    Record<string, string>
  >({});
  const [priorityDialogOpen, setPriorityDialogOpen] = useState(false);
  const [catalogueDialogOpen, setCatalogueDialogOpen] = useState(false);

  // "Selected from your organisation": the values on the organisation profile.
  const { data: session } = useSession();
  const tenantId = session?.user?.tenantId;
  const { tenant } = useTenant(tenantId, !!tenantId);
  const organisationValues = tenant?.values ?? [];

  // "Suggested Values": the rest of the catalogue. Only the expanded type shows
  // its values, so only that type is fetched.
  const debouncedCategorySearch = useDebounce(
    (categorySearchQuery[activeCategory] || '').trim(),
    500,
  );
  const { values: catalogueValues, isLoading: isCatalogueLoading } = useValues({
    type: activeCategory,
    clientSearch: debouncedCategorySearch || undefined,
    limit: 20,
  });

  const toggleCategory = (category: VALUE_TYPE_ENUM) => {
    setActiveCategory(category);
  };

  const currentCategoryLabel = VALUE_TYPE_LABELS[activeCategory];

  // Highest priority first, so a row moves as soon as its priority changes.
  // Values sharing a priority keep the order they were added in (stable sort).
  const byPriority = (a: ValueRow, b: ValueRow) =>
    PRIORITY_RANKS.findIndex((r) => r.priority === a.priority) -
    PRIORITY_RANKS.findIndex((r) => r.priority === b.priority);

  const activeCategoryValues = selectedValues
    .filter((v) => v.category === activeCategory)
    .sort(byPriority);

  const isValueSelected = (valueId: string) => {
    return selectedValues.some((v) => v.id === valueId);
  };

  const getCategoryCount = (category: string) => {
    return selectedValues.filter((v) => v.category === category).length;
  };

  const isAtTotalMax = selectedValues.length >= JOB_VALUES_MAX_TOTAL;

  usePageContext({
    page: 'recruiter.job.edit.values',
    summary:
      'Step 4 of editing a job post: the workplace values the job looks for, in five categories, ' +
      'each with a priority. The user presses Continue to save this step and move on.',
    state: {
      jobId: defaultValues._id,
      // Names trimmed so 25 values stay inside the server's size cap.
      selected: Object.fromEntries(
        CATEGORIES.map((category) => [
          category,
          selectedValues
            .filter((row) => row.category === category)
            .map((row) => `${row.name.slice(0, 40)} (${row.priority})`),
        ]),
      ),
      showing: activeCategory,
      limits: {
        perCategory: JOB_VALUES_MAX_PER_TYPE,
        total: JOB_VALUES_MAX_TOTAL,
      },
    },
  });

  const addValue = (value: ValueData) => {
    if (isValueSelected(value._id)) return;

    // At most JOB_VALUES_MAX_PER_TYPE per type and JOB_VALUES_MAX_TOTAL overall;
    // the backend enforces both again.
    if (getCategoryCount(value.type) >= JOB_VALUES_MAX_PER_TYPE) return;
    if (isAtTotalMax) return;

    const newItem: ValueRow = {
      id: value._id,
      category: value.type,
      name: value.label,
      priority: PRIORITY_RANKS[0].priority, // Essentials by default
    };

    setSelectedValues((prev) => [...prev, newItem]);
    setError(null);
  };

  const removeValue = (id: string) => {
    setSelectedValues((prev) => prev.filter((v) => v.id !== id));
  };

  const updateRank = (id: string, priority: JOB_VALUE_PRIORITY_ENUMS) => {
    setSelectedValues((prev) =>
      prev.map((v) => (v.id === id ? { ...v, priority } : v)),
    );
  };

  // Back keeps unsaved picks in the wizard, as the other steps do; only
  // Continue saves.
  const handlePrev = () => {
    prev({
      values: selectedValues.map(({ id, category, name, priority }) => ({
        value: { _id: id, type: category, label: name },
        priority,
        weight: JOB_VALUE_PRIORITY_WEIGHT[priority],
      })),
    });
  };

  const handleNext = async () => {
    // Publishing needs at least one value; say so here rather than at publish.
    if (selectedValues.length === 0) {
      setError('Add at least one value to continue.');
      return;
    }

    await updateJob({
      id: defaultValues._id,
      data: {
        // Saved in the order shown, so the preview lists them the same way.
        values: [...selectedValues]
          .sort(byPriority)
          .map(({ id, priority }) => ({
            value: id,
            priority,
          })),
      },
      onSuccessNext: (newData) => next(newData),
    });
  };

  return (
    <div className="space-y-spacing-4xl pb-10">
      {/* Header */}
      <div>
        <h2 className="text-label-xl font-label-xl-strong! text-text-gray-primary">
          Values and Potentials
        </h2>
        <p className="text-body-sm text-text-gray-tertiary mt-1">
          Choose values in each category and set how much each one matters. A
          priority counts the same in every category: Essentials is x4
          everywhere.
        </p>
      </div>

      {/* Two Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Value Catalogue */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center gap-1.5">
            <h3 className="text-label-md font-label-md-strong! text-text-gray-primary">
              Value Catalogue
            </h3>
            <button
              type="button"
              onClick={() => setCatalogueDialogOpen(true)}
              className="text-text-gray-quaternary hover:text-text-brand-primary cursor-pointer p-0.5 rounded transition-colors"
              title="Learn more about Value Catalogue"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {CATEGORIES.map((cat) => {
              const isExpanded = activeCategory === cat;
              const count = getCategoryCount(cat);
              const label = VALUE_TYPE_LABELS[cat];
              const query = (categorySearchQuery[cat] || '')
                .trim()
                .toLowerCase();

              const categoryOrgValues = organisationValues.filter(
                (v) => v.type === cat,
              );
              const filteredOrg = categoryOrgValues.filter((v) =>
                v.label.toLowerCase().includes(query),
              );
              // Already searched server-side; the organisation's own values
              // are listed above, so they are left out here.
              const filteredSuggested = isExpanded
                ? catalogueValues.filter(
                    (v) => !categoryOrgValues.some((o) => o._id === v._id),
                  )
                : [];

              return (
                <div
                  key={cat}
                  className={cn(
                    'rounded-2xl border bg-white transition-all overflow-hidden',
                    isExpanded
                      ? 'border-pink-300 ring-1 ring-pink-100 shadow-sm'
                      : 'border-border-gray-secondary hover:border-border-gray-primary',
                  )}
                >
                  {/* Category Header */}
                  <div
                    onClick={() => toggleCategory(cat)}
                    className="p-4 flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2 text-label-sm font-label-sm-strong! text-text-gray-primary">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-text-gray-tertiary" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-text-gray-tertiary" />
                      )}
                      <span>{label}</span>
                    </div>

                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-label-xs font-semibold',
                        count > 0
                          ? 'bg-pink-50 text-pink-600 border border-pink-200'
                          : 'bg-bg-gray-soft-primary text-text-gray-quaternary',
                      )}
                    >
                      {count}/{JOB_VALUES_MAX_PER_TYPE}
                    </span>
                  </div>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 space-y-4 border-t border-pink-100">
                      {/* Search in category */}
                      <div className="relative">
                        <Search className="w-4 h-4 text-text-gray-quaternary absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={categorySearchQuery[cat] || ''}
                          onChange={(e) =>
                            setCategorySearchQuery((prev) => ({
                              ...prev,
                              [cat]: e.target.value,
                            }))
                          }
                          placeholder={`Search ${label} values...`}
                          className="w-full pl-9 pr-3 py-2 text-body-sm rounded-xl border border-border-gray-secondary outline-none focus:border-border-brand-primary transition-all text-text-gray-primary placeholder:text-text-gray-quaternary"
                        />
                      </div>

                      {/* Selected from your organisation */}
                      {filteredOrg.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-label-xs text-text-gray-tertiary">
                            Selected from your organisation
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {filteredOrg.map((val) => {
                              const selected = isValueSelected(val._id);
                              const isFull =
                                count >= JOB_VALUES_MAX_PER_TYPE ||
                                isAtTotalMax;
                              return (
                                <button
                                  key={val._id}
                                  type="button"
                                  onClick={() => addValue(val)}
                                  disabled={selected || isFull}
                                  className={cn(
                                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-label-xs font-medium border transition-colors',
                                    selected
                                      ? 'bg-pink-50 text-pink-700 border-pink-200 opacity-60 cursor-default'
                                      : isFull
                                        ? 'bg-bg-gray-soft-primary text-text-gray-quaternary border-border-gray-secondary opacity-50 cursor-not-allowed'
                                        : 'bg-white text-text-gray-primary border-border-gray-secondary hover:border-border-brand-primary hover:text-text-brand-primary cursor-pointer',
                                  )}
                                >
                                  {!selected && <Plus className="w-3 h-3" />}
                                  <span>{val.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Suggested Values */}
                      {filteredSuggested.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-label-xs text-text-gray-tertiary">
                            Suggested Values
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {filteredSuggested.map((val) => {
                              const selected = isValueSelected(val._id);
                              const isFull =
                                count >= JOB_VALUES_MAX_PER_TYPE ||
                                isAtTotalMax;
                              return (
                                <button
                                  key={val._id}
                                  type="button"
                                  onClick={() => addValue(val)}
                                  disabled={selected || isFull}
                                  className={cn(
                                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-label-xs font-medium border transition-colors',
                                    selected
                                      ? 'bg-pink-50 text-pink-700 border-pink-200 opacity-60 cursor-default'
                                      : isFull
                                        ? 'bg-bg-gray-soft-primary text-text-gray-quaternary border-border-gray-secondary opacity-50 cursor-not-allowed'
                                        : 'bg-white text-text-gray-primary border-border-gray-secondary hover:border-border-brand-primary hover:text-text-brand-primary cursor-pointer',
                                  )}
                                >
                                  {!selected && <Plus className="w-3 h-3" />}
                                  <span>{val.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {isCatalogueLoading ? (
                        <p className="text-label-xs text-text-gray-quaternary">
                          Loading values...
                        </p>
                      ) : (
                        filteredOrg.length === 0 &&
                        filteredSuggested.length === 0 && (
                          <p className="text-label-xs text-text-gray-quaternary">
                            No values found.
                          </p>
                        )
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Set Priority Ranks */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h3 className="text-label-md font-label-md-strong! text-text-gray-primary">
                Set Priority Ranks
              </h3>
              <button
                type="button"
                onClick={() => setPriorityDialogOpen(true)}
                className="text-text-gray-quaternary hover:text-text-brand-primary cursor-pointer p-0.5 rounded transition-colors"
                title="Learn more about Priority Ranks"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>

            <span className="px-3 py-1 rounded-full text-label-xs font-label-xs-strong! bg-emerald-50 text-emerald-700 border border-emerald-200">
              {activeCategoryValues.length} of {JOB_VALUES_MAX_PER_TYPE}{' '}
              Selected
            </span>
          </div>

          <div className="space-y-3">
            {activeCategoryValues.length === 0 ? (
              <div className="border border-dashed border-border-gray-secondary rounded-2xl p-10 text-center bg-white">
                <p className="text-body-sm text-text-gray-tertiary">
                  No values selected for {currentCategoryLabel} yet. Choose
                  values from the catalogue on the left.
                </p>
              </div>
            ) : (
              activeCategoryValues.map((item) => {
                const rankConfig =
                  PRIORITY_RANKS.find((r) => r.priority === item.priority) ||
                  PRIORITY_RANKS[0];

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-border-gray-secondary bg-white shadow-xs flex items-center justify-between gap-3 hover:border-border-gray-primary transition-colors"
                  >
                    {/* Left: Drag grip & Name */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span className="text-label-sm font-label-sm-strong! text-text-gray-primary truncate">
                        {item.name}
                      </span>
                    </div>

                    {/* Right: Rank selector & Multiplier & Delete */}
                    <div className="flex items-center gap-3 shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-xs cursor-pointer transition-all',
                              rankConfig.badgeClass,
                            )}
                          >
                            <span>
                              {JOB_VALUE_PRIORITY_LABELS[item.priority]}
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-white rounded-xl shadow-lg border border-border-gray-secondary p-1 min-w-[170px]"
                        >
                          {PRIORITY_RANKS.map((option) => (
                            <DropdownMenuItem
                              key={option.priority}
                              onClick={() =>
                                updateRank(item.id, option.priority)
                              }
                              className="flex items-center justify-between px-3 py-2 text-label-sm rounded-lg cursor-pointer hover:bg-bg-gray-soft-primary"
                            >
                              <span
                                className={
                                  item.priority === option.priority
                                    ? 'font-bold text-text-brand-primary'
                                    : 'text-text-gray-primary'
                                }
                              >
                                {JOB_VALUE_PRIORITY_LABELS[option.priority]}
                              </span>
                              <span className="text-text-gray-quaternary text-xs font-medium">
                                {multiplierText(option.priority)}
                              </span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <span className="text-label-sm font-medium text-text-gray-secondary w-6 text-center">
                        {multiplierText(item.priority)}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeValue(item.id)}
                        className="text-text-gray-quaternary hover:text-red-500 p-1 rounded-lg cursor-pointer transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {error && (
        <p className="text-label-sm text-text-error-primary text-right">
          {error}
        </p>
      )}

      {/* Footer Navigation Buttons */}
      <div className="flex justify-end gap-spacing-md pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrev}
          className="h-10 px-spacing-xl rounded-lg text-label-sm font-label-sm-strong! text-text-gray-secondary"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          disabled={isPending}
          className="h-10 px-spacing-xl rounded-lg text-label-sm font-label-sm-strong! text-white bg-bg-brand-solid-primary hover:bg-bg-brand-solid-hover"
        >
          {isPending ? 'Saving...' : 'Continue'}
        </Button>
      </div>

      {/* Lets Alice choose values, one category at a time. Saving is still Continue. */}
      {CATEGORIES.map((category) => (
        <ValuesCategoryAction
          key={category}
          category={category}
          selected={selectedValues}
          setSelected={(update) => {
            setSelectedValues(update);
            setError(null);
          }}
          reveal={() => setActiveCategory(category)}
        />
      ))}

      {/* Dialog Modals */}
      <PriorityRanksDialog
        open={priorityDialogOpen}
        onOpenChange={setPriorityDialogOpen}
      />
      <ValueCatalogueDialog
        open={catalogueDialogOpen}
        onOpenChange={setCatalogueDialogOpen}
      />
    </div>
  );
}

/**
 * Registers Alice's action for one category and renders nothing — a component
 * rather than a hook call per category, so the five stay in step with
 * `CATEGORIES`.
 */
function ValuesCategoryAction(
  props: Parameters<typeof useValuesCategoryAction>[0],
) {
  useValuesCategoryAction(props);
  return null;
}
