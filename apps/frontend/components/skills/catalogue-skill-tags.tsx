'use client';

import React, { useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { RemovableChip } from '@/components/removable-chip';
import { useSkillCatalog } from '@/services/skill-catalog/skill-catalog.client';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

// Chips shown while the field is not in use; the rest collapse into "+N".
const COLLAPSED_COUNT = 2;

/** A picked catalogue entry: the id is what is saved, the name what is shown. */
export type CatalogueSkill = { _id: string; name: string };

interface CatalogueSkillTagsProps {
  value: CatalogueSkill[];
  onChange: (skills: CatalogueSkill[]) => void;
  /** Most skills the field accepts; the search closes once it is reached. */
  max: number;
  id?: string;
  placeholder?: string;
  invalid?: boolean;
}

/**
 * Skills picked from the skill catalogue, shown as removable chips — the same
 * catalogue a job's and a profile's skills come from, with no level to set.
 * Typing searches the catalogue; a click, or Enter for the first match, adds
 * an entry. Backspace on an empty field removes the last chip. Nothing typed
 * is ever added as free text.
 */
export default function CatalogueSkillTags({
  value,
  onChange,
  max,
  id,
  placeholder = 'Search and pick skills',
  invalid = false,
}: CatalogueSkillTagsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebounce(searchQuery.trim(), 500);
  const isAtMax = value.length >= max;
  const isDropdownOpen = isFocused && !isAtMax;

  // Only searched while the dropdown is open, so the form makes no request
  // until the user starts picking.
  const {
    skills: catalogueSkills,
    isFetching: isSearching,
    isError,
  } = useSkillCatalog(
    { clientSearch: debouncedSearch || undefined, limit: 20 },
    isDropdownOpen,
  );

  const matches = catalogueSkills.filter(
    (item) => !value.some((skill) => skill._id === item._id),
  );

  const showAll = isFocused || value.length <= COLLAPSED_COUNT;
  const shownSkills = showAll ? value : value.slice(0, COLLAPSED_COUNT);
  const hiddenCount = value.length - shownSkills.length;

  const addSkill = (item: CatalogueSkill) => {
    if (isAtMax || value.some((skill) => skill._id === item._id)) return;
    onChange([...value, { _id: item._id, name: item.name }]);
    setSearchQuery('');
  };

  const removeSkill = (skillId: string) => {
    onChange(value.filter((skill) => skill._id !== skillId));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Picks instead of submitting the surrounding form.
      e.preventDefault();
      // Only once the results are for what is typed now, so Enter never adds
      // a match left over from the previous keystroke.
      const resultsAreCurrent =
        debouncedSearch === searchQuery.trim() && !isSearching;
      if (resultsAreCurrent && matches.length > 0) addSkill(matches[0]);
    } else if (e.key === 'Escape') {
      inputRef.current?.blur();
    } else if (e.key === 'Backspace' && !searchQuery && value.length > 0) {
      removeSkill(value[value.length - 1]._id);
    }
  };

  const dropdownMessage = isError
    ? 'Skills could not be loaded. Try again.'
    : isSearching
      ? 'Searching...'
      : 'No matching skills in the catalogue.';

  return (
    <div
      className="relative"
      onMouseDown={(e) => {
        // Keeps focus in the search field, so pressing a chip's ×, "+N" or a
        // result never blurs (and closes) the field before the click lands.
        if (e.target !== inputRef.current) e.preventDefault();
        inputRef.current?.focus();
      }}
    >
      <div
        className={cn(
          'min-h-10 w-full rounded-lg border border-border-gray-primary shadow-xs bg-white px-spacing-md py-spacing-xs flex flex-wrap items-center gap-spacing-2xs cursor-text transition-all',
          'focus-within:border-border-brand-primary focus-within:ring-2 focus-within:ring-pink-100',
          invalid && 'border-border-error-primary',
        )}
      >
        <AnimatePresence initial={false}>
          {shownSkills.map((skill) => (
            <RemovableChip
              key={skill._id}
              label={skill.name}
              onRemove={() => removeSkill(skill._id)}
            />
          ))}
        </AnimatePresence>

        {hiddenCount > 0 && (
          <span className="inline-flex items-center min-h-6 py-spacing-3xs px-spacing-md rounded-lg bg-bg-gray-soft-primary text-body-xs text-others-gray-dark border border-border-gray-primary">
            +{hiddenCount}
          </span>
        )}

        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={isDropdownOpen}
          aria-invalid={invalid}
          autoComplete="off"
          value={searchQuery}
          readOnly={isAtMax}
          placeholder={
            isAtMax
              ? `Limit of ${max} reached`
              : value.length
                ? ''
                : placeholder
          }
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Only catalogue entries can be added, so unpicked text is dropped.
            setSearchQuery('');
            setIsFocused(false);
          }}
          className="flex-1 min-w-20 h-7 bg-transparent outline-none text-text-gray-primary text-label-md font-label-md-strong! placeholder:text-text-gray-quaternary"
        />
      </div>

      {isDropdownOpen && (
        <div
          role="listbox"
          className="absolute z-20 top-full mt-1 left-0 w-full max-h-56 overflow-y-auto bg-white rounded-xl border border-border-gray-secondary shadow-lg py-1"
        >
          {matches.length > 0 && !isError ? (
            matches.map((item) => (
              <button
                key={item._id}
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => addSkill(item)}
                className="w-full text-left px-4 py-2 text-label-sm text-text-gray-secondary hover:bg-bg-brand-soft-primary hover:text-text-brand-primary transition-colors cursor-pointer"
              >
                {item.name}
              </button>
            ))
          ) : (
            <p className="px-4 py-2 text-label-sm text-text-gray-quaternary">
              {dropdownMessage}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
