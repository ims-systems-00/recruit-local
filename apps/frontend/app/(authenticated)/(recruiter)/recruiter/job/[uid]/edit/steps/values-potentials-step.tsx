'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  Info,
  Plus,
  Search,
  X,
} from 'lucide-react';
import {
  JobData,
  JobValueItem,
  ValuePriorityRank,
} from '@/services/jobs/job.type';
import { cn } from '@/lib/utils';
import { PriorityRanksDialog } from './modals/priority-ranks-dialog';
import { ValueCatalogueDialog } from './modals/value-catalogue-dialog';

interface CategoryData {
  id: string;
  name: string;
  orgValues: string[];
  suggestedValues: string[];
}

const CATEGORIES: CategoryData[] = [
  {
    id: 'mindset',
    name: 'Mindset',
    orgValues: [
      'Growth-oriented',
      'Entrepreneurial',
      'Proactive',
      'Critical thinker',
      'Solution-focused',
    ],
    suggestedValues: [
      'Analytical',
      'Strategic thinker',
      'Resilient',
      'Open-minded',
      'Problem solver',
      'Creative',
      'Ambitious',
    ],
  },
  {
    id: 'working-style',
    name: 'Working style',
    orgValues: [
      'Collaborative',
      'Detail-oriented',
      'Autonomous',
      'Organized',
      'Flexible',
    ],
    suggestedValues: [
      'Adaptable',
      'Fast-paced',
      'Methodical',
      'Communicative',
      'Pragmatic',
    ],
  },
  {
    id: 'culture-and-behavior',
    name: 'Culture & Behavior',
    orgValues: [
      'Inclusive',
      'Empathetic',
      'Transparent',
      'Respectful',
      'Ethical',
    ],
    suggestedValues: [
      'Authentic',
      'Accountable',
      'Humble',
      'Team player',
      'Kind',
    ],
  },
  {
    id: 'leadership',
    name: 'Leadership & team dynamics',
    orgValues: [
      'Mentorship',
      'Empowering',
      'Visionary',
      'Decisive',
      'Supportive',
    ],
    suggestedValues: [
      'Inspirational',
      'Coaching-oriented',
      'Trust-builder',
      'Delegator',
    ],
  },
  {
    id: 'motivation',
    name: 'Purpose & motivation',
    orgValues: [
      'Mission-driven',
      'Continuous learner',
      'Impact-focused',
      'Passionate',
      'Goal-oriented',
    ],
    suggestedValues: [
      'Excellence-driven',
      'Community-focused',
      'Self-starter',
      'Customer-first',
    ],
  },
];

const PRIORITY_RANKS: {
  rank: ValuePriorityRank;
  weight: number;
  multiplierText: string;
  badgeClass: string;
}[] = [
  {
    rank: 'Essentials',
    weight: 4,
    multiplierText: 'x4',
    badgeClass: 'bg-bg-brand-solid-primary text-white font-semibold',
  },
  {
    rank: 'Highly Important',
    weight: 3,
    multiplierText: 'x3',
    badgeClass: 'bg-pink-100 text-pink-700 font-semibold',
  },
  {
    rank: 'Important',
    weight: 2,
    multiplierText: 'x2',
    badgeClass: 'bg-pink-50 text-pink-600 font-medium',
  },
  {
    rank: 'Desirable',
    weight: 1,
    multiplierText: 'x1',
    badgeClass: 'bg-bg-gray-soft-secondary text-text-gray-secondary font-medium',
  },
];

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
  const [selectedValues, setSelectedValues] = useState<JobValueItem[]>(() => {
    if (defaultValues.values && defaultValues.values.length > 0) {
      return defaultValues.values;
    }
    // Default initial mock selected values matching Image 3
    return [
      {
        id: '1',
        category: 'mindset',
        name: 'Growth-oriented',
        rank: 'Essentials',
        weight: 4,
      },
      {
        id: '2',
        category: 'mindset',
        name: 'Analytical',
        rank: 'Essentials',
        weight: 4,
      },
      {
        id: '3',
        category: 'mindset',
        name: 'Entrepreneurial',
        rank: 'Highly Important',
        weight: 3,
      },
      {
        id: '4',
        category: 'mindset',
        name: 'Proactive',
        rank: 'Important',
        weight: 2,
      },
      {
        id: '5',
        category: 'mindset',
        name: 'Strategic thinker',
        rank: 'Desirable',
        weight: 1,
      },
    ];
  });

  const [activeCategory, setActiveCategory] = useState<string>('mindset');
  const [categorySearchQuery, setCategorySearchQuery] = useState<
    Record<string, string>
  >({});
  const [priorityDialogOpen, setPriorityDialogOpen] = useState(false);
  const [catalogueDialogOpen, setCatalogueDialogOpen] = useState(false);

  const toggleCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
  };

  const currentCategory =
    CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0];

  const activeCategoryValues = selectedValues.filter(
    (v) => v.category === currentCategory.id,
  );

  const isValueSelected = (valName: string) => {
    return selectedValues.some(
      (v) => v.name.toLowerCase() === valName.toLowerCase(),
    );
  };

  const getCategoryCount = (categoryId: string) => {
    return selectedValues.filter((v) => v.category === categoryId).length;
  };

  const addValue = (categoryId: string, valName: string) => {
    if (isValueSelected(valName)) return;

    // Each value type can contain maximum 5 values
    if (getCategoryCount(categoryId) >= 5) {
      return;
    }

    const defaultRankConfig = PRIORITY_RANKS[0]; // Essentials by default
    const newItem: JobValueItem = {
      id: crypto.randomUUID(),
      category: categoryId,
      name: valName,
      rank: defaultRankConfig.rank,
      weight: defaultRankConfig.weight,
    };

    setSelectedValues((prev) => [...prev, newItem]);
  };

  const removeValue = (id: string) => {
    setSelectedValues((prev) => prev.filter((v) => v.id !== id));
  };

  const updateRank = (id: string, rank: ValuePriorityRank) => {
    const config = PRIORITY_RANKS.find((r) => r.rank === rank);
    const weight = config ? config.weight : 1;

    setSelectedValues((prev) =>
      prev.map((v) => (v.id === id ? { ...v, rank, weight } : v)),
    );
  };

  const handlePrev = () => {
    prev({
      values: selectedValues,
    });
  };

  const handleNext = () => {
    next({
      values: selectedValues,
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
          Choose values and set their importance separately within each category.
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
              const isExpanded = activeCategory === cat.id;
              const count = getCategoryCount(cat.id);
              const query = (categorySearchQuery[cat.id] || '').toLowerCase();

              const filteredOrg = cat.orgValues.filter((v) =>
                v.toLowerCase().includes(query),
              );
              const filteredSuggested = cat.suggestedValues.filter((v) =>
                v.toLowerCase().includes(query),
              );

              return (
                <div
                  key={cat.id}
                  className={cn(
                    'rounded-2xl border bg-white transition-all overflow-hidden',
                    isExpanded
                      ? 'border-pink-300 ring-1 ring-pink-100 shadow-sm'
                      : 'border-border-gray-secondary hover:border-border-gray-primary',
                  )}
                >
                  {/* Category Header */}
                  <div
                    onClick={() => toggleCategory(cat.id)}
                    className="p-4 flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2 text-label-sm font-label-sm-strong! text-text-gray-primary">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-text-gray-tertiary" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-text-gray-tertiary" />
                      )}
                      <span>{cat.name}</span>
                    </div>

                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-label-xs font-semibold',
                        count > 0
                          ? 'bg-pink-50 text-pink-600 border border-pink-200'
                          : 'bg-bg-gray-soft-primary text-text-gray-quaternary',
                      )}
                    >
                      {count}/5
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
                          value={categorySearchQuery[cat.id] || ''}
                          onChange={(e) =>
                            setCategorySearchQuery((prev) => ({
                              ...prev,
                              [cat.id]: e.target.value,
                            }))
                          }
                          placeholder={`Search ${cat.name} values...`}
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
                              const selected = isValueSelected(val);
                              const isCatFull = count >= 5;
                              return (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => addValue(cat.id, val)}
                                  disabled={selected || isCatFull}
                                  className={cn(
                                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-label-xs font-medium border transition-colors',
                                    selected
                                      ? 'bg-pink-50 text-pink-700 border-pink-200 opacity-60 cursor-default'
                                      : isCatFull
                                        ? 'bg-bg-gray-soft-primary text-text-gray-quaternary border-border-gray-secondary opacity-50 cursor-not-allowed'
                                        : 'bg-white text-text-gray-primary border-border-gray-secondary hover:border-border-brand-primary hover:text-text-brand-primary cursor-pointer',
                                  )}
                                >
                                  {!selected && <Plus className="w-3 h-3" />}
                                  <span>{val}</span>
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
                              const selected = isValueSelected(val);
                              const isCatFull = count >= 5;
                              return (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => addValue(cat.id, val)}
                                  disabled={selected || isCatFull}
                                  className={cn(
                                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-label-xs font-medium border transition-colors',
                                    selected
                                      ? 'bg-pink-50 text-pink-700 border-pink-200 opacity-60 cursor-default'
                                      : isCatFull
                                        ? 'bg-bg-gray-soft-primary text-text-gray-quaternary border-border-gray-secondary opacity-50 cursor-not-allowed'
                                        : 'bg-white text-text-gray-primary border-border-gray-secondary hover:border-border-brand-primary hover:text-text-brand-primary cursor-pointer',
                                  )}
                                >
                                  {!selected && <Plus className="w-3 h-3" />}
                                  <span>{val}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
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
              {activeCategoryValues.length} of 5 Selected
            </span>
          </div>

          <div className="space-y-3">
            {activeCategoryValues.length === 0 ? (
              <div className="border border-dashed border-border-gray-secondary rounded-2xl p-10 text-center bg-white">
                <p className="text-body-sm text-text-gray-tertiary">
                  No values selected for {currentCategory.name} yet. Choose values from the catalogue on the left.
                </p>
              </div>
            ) : (
              activeCategoryValues.map((item) => {
                const rankConfig =
                  PRIORITY_RANKS.find((r) => r.rank === item.rank) ||
                  PRIORITY_RANKS[0];

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-border-gray-secondary bg-white shadow-xs flex items-center justify-between gap-3 hover:border-border-gray-primary transition-colors"
                  >
                    {/* Left: Drag grip & Name */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <GripVertical className="w-4 h-4 text-text-gray-quaternary shrink-0 cursor-grab" />
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
                            <span>{item.rank}</span>
                            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-white rounded-xl shadow-lg border border-border-gray-secondary p-1 min-w-[170px]"
                        >
                          {PRIORITY_RANKS.map((option) => (
                            <DropdownMenuItem
                              key={option.rank}
                              onClick={() => updateRank(item.id, option.rank)}
                              className="flex items-center justify-between px-3 py-2 text-label-sm rounded-lg cursor-pointer hover:bg-bg-gray-soft-primary"
                            >
                              <span
                                className={
                                  item.rank === option.rank
                                    ? 'font-bold text-text-brand-primary'
                                    : 'text-text-gray-primary'
                                }
                              >
                                {option.rank}
                              </span>
                              <span className="text-text-gray-quaternary text-xs font-medium">
                                {option.multiplierText}
                              </span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <span className="text-label-sm font-medium text-text-gray-secondary w-6 text-center">
                        {rankConfig.multiplierText}
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
          className="h-10 px-spacing-xl rounded-lg text-label-sm font-label-sm-strong! text-white bg-bg-brand-solid-primary hover:bg-bg-brand-solid-hover"
        >
          Continue
        </Button>
      </div>

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
