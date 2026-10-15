'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  JobData,
  JobSkillItem,
  SkillLevel,
  SkillRequirement,
} from '@/services/jobs/job.type';
import { cn } from '@/lib/utils';

const DEFAULT_CATALOGUE_SKILLS = [
  'Medication Administration',
  'Manual handling',
  'Personal care',
  'Patient Assessment',
  'First Aid & CPR',
  'Wound Care',
  'Vital Signs Monitoring',
  'Dementia Care',
  'Infection Control',
  'Nutrition & Hydration Support',
  'Palliative Care',
  'Health Record Management',
  'Communication & Empathy',
  'Rehabilitation Support',
  'Mental Health Support',
  'Catheter Care',
  'Stoma Care',
  'Time Management',
  'Emergency Response',
];

const SKILL_LEVELS: SkillLevel[] = [
  'Willing to Learn',
  'Beginner',
  'Intermediate',
  'Advance',
];

const SKILL_REQUIREMENTS: SkillRequirement[] = ['Required', 'Preferred'];

interface SkillsRequirementsStepProps {
  defaultValues: JobData;
  prev: (data: Partial<JobData>) => void;
  next: (data: Partial<JobData>) => void;
}

export default function SkillsRequirementsStep({
  defaultValues,
  prev,
  next,
}: SkillsRequirementsStepProps) {
  const [saveForFuture, setSaveForFuture] = useState<boolean>(
    defaultValues.saveSkillsForFuture ?? true,
  );

  const [skills, setSkills] = useState<JobSkillItem[]>(() => {
    if (defaultValues.skills && defaultValues.skills.length > 0) {
      return defaultValues.skills;
    }
    // Default initial mock skills matching Image 1
    return [
      {
        id: '1',
        name: 'Medication Administration',
        level: 'Intermediate',
        requirement: 'Required',
      },
      {
        id: '2',
        name: 'Manual handling',
        level: 'Beginner',
        requirement: 'Preferred',
      },
    ];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const addSkill = (skillName: string) => {
    const trimmed = skillName.trim();
    if (!trimmed) return;

    if (skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setSearchQuery('');
      setIsDropdownOpen(false);
      return;
    }

    const newSkill: JobSkillItem = {
      id: crypto.randomUUID(),
      name: trimmed,
      level: 'Intermediate',
      requirement: 'Required',
    };

    setSkills((prevSkills) => [...prevSkills, newSkill]);
    setSearchQuery('');
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  };

  const removeSkill = (id: string) => {
    setSkills((prevSkills) => prevSkills.filter((s) => s.id !== id));
  };

  const updateSkillLevel = (id: string, level: SkillLevel) => {
    setSkills((prevSkills) =>
      prevSkills.map((s) => (s.id === id ? { ...s, level } : s)),
    );
  };

  const updateSkillRequirement = (
    id: string,
    requirement: SkillRequirement,
  ) => {
    setSkills((prevSkills) =>
      prevSkills.map((s) => (s.id === id ? { ...s, requirement } : s)),
    );
  };

  const handlePrev = () => {
    prev({
      skills,
      saveSkillsForFuture: saveForFuture,
    });
  };

  const handleNext = () => {
    next({
      skills,
      saveSkillsForFuture: saveForFuture,
    });
  };

  // Filter skills catalogue
  const filteredCatalogue = DEFAULT_CATALOGUE_SKILLS.filter((item) => {
    const isAlreadySelected = skills.some(
      (s) => s.name.toLowerCase() === item.toLowerCase(),
    );
    if (isAlreadySelected) return false;
    if (!searchQuery.trim()) return true;
    return item.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-spacing-4xl pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-spacing-md">
        <div>
          <h2 className="text-label-xl font-label-xl-strong! text-text-gray-primary">
            Skills &amp; Requirements
          </h2>
          <p className="text-body-sm text-text-gray-tertiary mt-1">
            Pick Skills from the catalogue so candidates can be match on them.
            Free Text can&apos;t be matched
          </p>
        </div>

        {/* Save for Future use checkbox */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="save-future"
            checked={saveForFuture}
            onCheckedChange={(checked) => setSaveForFuture(Boolean(checked))}
            className="border-border-brand-primary data-[state=checked]:bg-bg-brand-solid-primary data-[state=checked]:text-white"
          />
          <label
            htmlFor="save-future"
            className="text-label-sm whitespace-nowrap font-label-sm-strong! text-text-gray-secondary cursor-pointer select-none"
          >
            Save for Future use
          </label>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="border border-border-gray-secondary rounded-2xl p-spacing-4xl bg-white space-y-spacing-4xl">
        {/* Multi-select Search & Add Tags */}
        <div className="space-y-spacing-xs" ref={containerRef}>
          <label className="text-label-sm font-label-sm-strong! text-text-gray-secondary">
            Search &amp; Add Tags{' '}
            <span className="text-text-brand-primary">*</span>
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
            {skills.map((skill) => (
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
                  if (filteredCatalogue.length > 0) {
                    addSkill(filteredCatalogue[0]);
                  } else if (searchQuery.trim()) {
                    addSkill(searchQuery);
                  }
                } else if (
                  e.key === 'Backspace' &&
                  !searchQuery &&
                  skills.length > 0
                ) {
                  removeSkill(skills[skills.length - 1].id);
                }
              }}
              placeholder={
                skills.length === 0 ? 'Search and pick skills...' : ''
              }
              className="flex-1 min-w-[140px] border-none outline-none text-body-sm text-text-gray-primary bg-transparent placeholder:text-text-gray-quaternary"
            />
          </div>

          {/* Autocomplete Dropdown */}
          {isDropdownOpen && filteredCatalogue.length > 0 && (
            <div className="relative">
              <div className="absolute z-20 top-1 left-0 w-full max-h-56 overflow-y-auto bg-white rounded-xl border border-border-gray-secondary shadow-lg py-1">
                {filteredCatalogue.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => addSkill(item)}
                    className="w-full text-left px-4 py-2 text-label-sm text-text-gray-secondary hover:bg-bg-brand-soft-primary hover:text-text-brand-primary transition-colors cursor-pointer"
                  >
                    {item}
                  </button>
                ))}
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
                    Required Level
                  </TableHead>
                  <TableHead className="w-40 px-spacing-4xl py-spacing-md text-label-sm font-label-sm-strong! text-text-gray-secondary">
                    Requirements
                  </TableHead>
                  <TableHead className="w-12 px-spacing-4xl py-spacing-md text-label-sm font-label-sm-strong! text-text-gray-secondary"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skills.length === 0 ? (
                  <TableRow className="border-none! hover:bg-transparent">
                    <TableCell
                      colSpan={5}
                      className="p-8 text-center text-body-sm text-text-gray-quaternary"
                    >
                      No skills added yet. Search and add skills from the field
                      above.
                    </TableCell>
                  </TableRow>
                ) : (
                  skills.map((skill, index) => {
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

                        {/* Required Level Dropdown */}
                        <TableCell className="w-48 px-spacing-4xl py-spacing-md text-label-sm text-text-gray-secondary">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="flex items-center gap-1.5 text-label-sm text-text-gray-primary font-medium hover:text-text-brand-primary cursor-pointer transition-colors"
                              >
                                <span>{skill.level}</span>
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
                                  {level}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>

                        {/* Requirements Dropdown */}
                        <TableCell className="w-40 px-spacing-4xl py-spacing-md">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className={cn(
                                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-xs font-label-xs-strong! cursor-pointer transition-colors',
                                  skill.requirement === 'Required'
                                    ? 'bg-pink-50 text-pink-600 border border-pink-200'
                                    : 'bg-bg-gray-soft-secondary text-text-gray-secondary border border-border-gray-secondary',
                                )}
                              >
                                <span>{skill.requirement}</span>
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
                                  {req}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>

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
    </div>
  );
}
