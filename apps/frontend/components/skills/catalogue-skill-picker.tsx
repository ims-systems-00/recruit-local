'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronDown, X } from 'lucide-react';
import {
  JOB_SKILL_LEVEL_ENUMS,
  JOB_SKILL_LEVEL_LABELS,
  JOB_SKILL_REQUIREMENT_ENUMS,
  JOB_SKILL_REQUIREMENT_LABELS,
} from '@rl/types';
import { useSkillCatalog } from '@/services/skill-catalog/skill-catalog.client';
import { SkillCatalogData } from '@/services/skill-catalog/skill-catalog.type';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

const SKILL_LEVELS = Object.values(JOB_SKILL_LEVEL_ENUMS);

const SKILL_REQUIREMENTS = Object.values(JOB_SKILL_REQUIREMENT_ENUMS);

/**
 * A picked skill as the picker edits it: the catalogue entry and a level, plus
 * a requirement on forms that ask for one (a job does; a profile does not).
 */
export type CatalogueSkillRow = {
  id: string;
  name: string;
  level: JOB_SKILL_LEVEL_ENUMS;
  requirement?: JOB_SKILL_REQUIREMENT_ENUMS;
};

interface CatalogueSkillPickerProps<T extends CatalogueSkillRow> {
  rows: T[];
  onChange: (rows: T[]) => void;
  /** Builds the row for a catalogue entry just picked, with its starting level. */
  newRow: (item: SkillCatalogData) => T;
  /** Most rows the form accepts; the search closes once it is reached. */
  max: number;
  /** Heading of the level column — what the level means on this form. */
  levelHeading: string;
  /** Shows the Requirements column. `newRow` should then set `requirement`. */
  withRequirement?: boolean;
  /** Marks the search field as required. */
  required?: boolean;
  /** Shown under the table. */
  error?: string | null;
}

/**
 * Search the skill catalogue, add entries as tags, and set each one's level
 * (and requirement) in a table. Shared by the job form and the candidate
 * profile, so both pick skills the same way and from the same list.
 *
 * Renders the search and the table as siblings, so the parent's spacing sits
 * between them.
 */
export default function CatalogueSkillPicker<T extends CatalogueSkillRow>({
  rows,
  onChange,
  newRow,
  max,
  levelHeading,
  withRequirement = false,
  required = false,
  error,
}: CatalogueSkillPickerProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebounce(searchQuery.trim(), 500);
  const isAtMax = rows.length >= max;

  // Only searched while the dropdown is open, so the form makes no request
  // until the user starts picking.
  const { skills: catalogueSkills, isFetching: isSearching } = useSkillCatalog(
    { clientSearch: debouncedSearch || undefined, limit: 20 },
    isDropdownOpen && !isAtMax,
  );

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Catalogue entries only — free text cannot be matched between jobs and
  // candidates.
  const addSkill = (item: SkillCatalogData) => {
    if (isAtMax || rows.some((s) => s.id === item._id)) return;

    onChange([...rows, newRow(item)]);
    setSearchQuery('');
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  };

  const removeSkill = (id: string) => {
    onChange(rows.filter((s) => s.id !== id));
  };

  const updateSkillLevel = (id: string, level: JOB_SKILL_LEVEL_ENUMS) => {
    onChange(rows.map((s) => (s.id === id ? { ...s, level } : s)));
  };

  const updateSkillRequirement = (
    id: string,
    requirement: JOB_SKILL_REQUIREMENT_ENUMS,
  ) => {
    onChange(rows.map((s) => (s.id === id ? { ...s, requirement } : s)));
  };

  const filteredCatalogue = catalogueSkills.filter(
    (item) => !rows.some((s) => s.id === item._id),
  );

  return (
    <>
      {/* Multi-select Search & Add Tags */}
      <div className="space-y-spacing-xs" ref={containerRef}>
        <label className="text-label-sm font-label-sm-strong! text-text-gray-secondary">
          Search &amp; Add Tags{' '}
          {required && <span className="text-text-brand-primary">*</span>}
        </label>

        <div
          className={cn(
            'min-h-[46px] w-full rounded-xl border border-border-gray-primary px-3 py-2 flex flex-wrap items-center gap-2 bg-white transition-all',
            'focus-within:border-border-brand-primary focus-within:ring-2 focus-within:ring-pink-100',
          )}
          onClick={() => {
            inputRef.current?.focus();
            setIsDropdownOpen(true);
          }}
        >
          {rows.map((skill) => (
            <div
              key={skill.id}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-border-gray-secondary bg-bg-gray-soft-primary text-text-gray-primary text-label-sm font-medium"
            >
              <span>{skill.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeSkill(skill.id);
                }}
                className="text-text-gray-quaternary hover:text-text-gray-primary p-0.5 rounded cursor-pointer transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                // Only once the results are for what is typed now, so Enter
                // never adds a match left over from the previous keystroke.
                const resultsAreCurrent =
                  debouncedSearch === searchQuery.trim() && !isSearching;
                if (resultsAreCurrent && filteredCatalogue.length > 0) {
                  addSkill(filteredCatalogue[0]);
                }
              } else if (
                e.key === 'Backspace' &&
                !searchQuery &&
                rows.length > 0
              ) {
                removeSkill(rows[rows.length - 1].id);
              }
            }}
            placeholder={rows.length === 0 ? 'Search and pick skills...' : ''}
            className="flex-1 min-w-[140px] border-none outline-none text-body-sm text-text-gray-primary bg-transparent placeholder:text-text-gray-quaternary"
          />
        </div>

        {isAtMax && (
          <p className="text-body-sm text-text-gray-tertiary">
            You can add up to {max} skills.
          </p>
        )}

        {/* Autocomplete Dropdown */}
        {isDropdownOpen && !isAtMax && (
          <div className="relative">
            <div className="absolute z-20 top-1 left-0 w-full max-h-56 overflow-y-auto bg-white rounded-xl border border-border-gray-secondary shadow-lg py-1">
              {filteredCatalogue.length > 0 ? (
                filteredCatalogue.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => addSkill(item)}
                    className="w-full text-left px-4 py-2 text-label-sm text-text-gray-secondary hover:bg-bg-brand-soft-primary hover:text-text-brand-primary transition-colors cursor-pointer"
                  >
                    {item.name}
                  </button>
                ))
              ) : (
                <p className="px-4 py-2 text-label-sm text-text-gray-quaternary">
                  {isSearching
                    ? 'Searching...'
                    : 'No matching skills in the catalogue.'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Choose Skills Table */}
      <div className="space-y-3 pt-2">
        <h3 className="text-label-sm font-label-sm-strong! text-text-gray-secondary">
          Choose Skills
        </h3>

        <div className="overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow className="border-border-gray-secondary bg-bg-gray-soft-secondary">
                <TableHead className="w-16 px-spacing-4xl py-spacing-md text-label-sm font-label-sm-strong! text-text-gray-secondary"></TableHead>
                <TableHead className="px-spacing-4xl py-spacing-md text-label-sm font-label-sm-strong! text-text-gray-secondary">
                  Skills
                </TableHead>
                <TableHead className="w-48 px-spacing-4xl py-spacing-md text-label-sm font-label-sm-strong! text-text-gray-secondary">
                  {levelHeading}
                </TableHead>
                {withRequirement && (
                  <TableHead className="w-40 px-spacing-4xl py-spacing-md text-label-sm font-label-sm-strong! text-text-gray-secondary">
                    Requirements
                  </TableHead>
                )}
                <TableHead className="w-12 px-spacing-4xl py-spacing-md text-label-sm font-label-sm-strong! text-text-gray-secondary"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow className="border-none! hover:bg-transparent">
                  <TableCell
                    colSpan={withRequirement ? 5 : 4}
                    className="p-8 text-center text-body-sm text-text-gray-quaternary"
                  >
                    No skills added yet. Search and add skills from the field
                    above.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((skill, index) => {
                  const sl = String(index + 1).padStart(2, '0');
                  return (
                    <TableRow
                      key={skill.id}
                      className="border-none! hover:bg-bg-gray-soft-primary/40 transition-colors"
                    >
                      {/* Sl */}
                      <TableCell className="w-16 px-spacing-4xl py-spacing-md text-label-sm text-text-gray-secondary">
                        {sl}
                      </TableCell>

                      {/* Skill Name */}
                      <TableCell className="px-spacing-4xl py-spacing-md text-label-sm text-text-gray-secondary">
                        {skill.name}
                      </TableCell>

                      {/* Level Dropdown */}
                      <TableCell className="w-48 px-spacing-4xl py-spacing-md text-label-sm text-text-gray-secondary">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="flex items-center gap-1.5 text-label-sm text-text-gray-primary font-medium hover:text-text-brand-primary cursor-pointer transition-colors"
                            >
                              <span>{JOB_SKILL_LEVEL_LABELS[skill.level]}</span>
                              <ChevronDown className="w-4 h-4 text-text-gray-tertiary" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            className="bg-white rounded-xl shadow-lg border border-border-gray-secondary p-1 min-w-[160px]"
                          >
                            {SKILL_LEVELS.map((level) => (
                              <DropdownMenuItem
                                key={level}
                                onClick={() =>
                                  updateSkillLevel(skill.id, level)
                                }
                                className={cn(
                                  'text-label-sm rounded-lg px-3 py-2 cursor-pointer',
                                  skill.level === level
                                    ? 'bg-bg-gray-soft-primary text-text-gray-primary font-semibold'
                                    : 'text-text-gray-secondary hover:bg-bg-gray-soft-primary',
                                )}
                              >
                                {JOB_SKILL_LEVEL_LABELS[level]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>

                      {/* Requirements Dropdown */}
                      {withRequirement && (
                        <TableCell className="w-40 px-spacing-4xl py-spacing-md">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className={cn(
                                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-xs font-label-xs-strong! cursor-pointer transition-colors',
                                  skill.requirement ===
                                    JOB_SKILL_REQUIREMENT_ENUMS.REQUIRED
                                    ? 'bg-pink-50 text-pink-600 border border-pink-200'
                                    : 'bg-bg-gray-soft-secondary text-text-gray-secondary border border-border-gray-secondary',
                                )}
                              >
                                <span>
                                  {skill.requirement &&
                                    JOB_SKILL_REQUIREMENT_LABELS[
                                      skill.requirement
                                    ]}
                                </span>
                                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="start"
                              className="bg-white rounded-xl shadow-lg border border-border-gray-secondary p-1 min-w-[130px]"
                            >
                              {SKILL_REQUIREMENTS.map((req) => (
                                <DropdownMenuItem
                                  key={req}
                                  onClick={() =>
                                    updateSkillRequirement(skill.id, req)
                                  }
                                  className={cn(
                                    'text-label-sm rounded-lg px-3 py-2 cursor-pointer',
                                    skill.requirement === req
                                      ? 'bg-bg-gray-soft-primary text-text-gray-primary font-semibold'
                                      : 'text-text-gray-secondary hover:bg-bg-gray-soft-primary',
                                  )}
                                >
                                  {JOB_SKILL_REQUIREMENT_LABELS[req]}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}

                      {/* Remove Button */}
                      <TableCell className="w-12 px-spacing-4xl py-spacing-md text-center">
                        <button
                          type="button"
                          onClick={() => removeSkill(skill.id)}
                          className="text-text-gray-quaternary hover:text-red-500 p-1 rounded-lg cursor-pointer transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {error && (
          <p className="text-label-sm text-text-error-primary">{error}</p>
        )}
      </div>
    </>
  );
}
