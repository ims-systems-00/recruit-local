'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  JOB_SKILL_LEVEL_ENUMS,
  JOB_SKILL_REQUIREMENT_ENUMS,
  JOB_SKILLS_MAX,
} from '@rl/types';
import { JobData } from '@/services/jobs/job.type';
import { useUpdateJob } from '@/services/jobs/jobs.client';
import CatalogueSkillPicker, {
  CatalogueSkillRow,
} from '@/components/skills/catalogue-skill-picker';
import { usePageContext } from '@/components/ai-chat/page-context';
import { useJobSkillsAction } from './skills-requirements-fill';

// A selected skill as this step edits it: the catalogue entry, plus the level
// and requirement the job asks for.
type SkillRow = CatalogueSkillRow & {
  requirement: JOB_SKILL_REQUIREMENT_ENUMS;
};

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

  const [skills, setSkills] = useState<SkillRow[]>(() =>
    (defaultValues.skills ?? []).map(({ skill, level, requirement }) => ({
      id: skill._id,
      name: skill.name,
      level,
      requirement,
    })),
  );

  const [error, setError] = useState<string | null>(null);

  const { updateJob, isPending } = useUpdateJob();

  usePageContext({
    page: 'recruiter.job.edit.skills',
    summary:
      'Step 3 of editing a job post: the skills the job needs, each with a level and whether it ' +
      'is required or preferred. The user presses Continue to save this step and move on.',
    state: {
      jobId: defaultValues._id,
      // Names trimmed so twenty skills stay inside the server's size cap.
      skills: skills.map(
        (row) => `${row.name.slice(0, 40)} (${row.level}, ${row.requirement})`,
      ),
      limit: JOB_SKILLS_MAX,
    },
  });

  // Lets Alice add skills. Saving is still Continue.
  useJobSkillsAction({
    skills,
    setSkills: (rows) => {
      setSkills(rows);
      setError(null);
    },
  });

  // Back keeps unsaved picks in the wizard, as the other steps do; only
  // Continue saves.
  const handlePrev = () => {
    prev({
      skills: skills.map(({ id, name, level, requirement }) => ({
        skill: { _id: id, name },
        level,
        requirement,
      })),
      saveSkillsForFuture: saveForFuture,
    });
  };

  const handleNext = async () => {
    // Publishing needs at least one skill; say so here rather than at publish.
    if (skills.length === 0) {
      setError('Add at least one skill to continue.');
      return;
    }

    await updateJob({
      id: defaultValues._id,
      data: {
        skills: skills.map(({ id, level, requirement }) => ({
          skill: id,
          level,
          requirement,
        })),
      },
      // Not saved yet — "Save for Future use" is still to be built — so it
      // rides along in the wizard's state only.
      onSuccessNext: (newData) =>
        next({ ...newData, saveSkillsForFuture: saveForFuture }),
    });
  };

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
        <CatalogueSkillPicker
          rows={skills}
          // The only error is "add at least one", so any change answers it.
          onChange={(rows) => {
            setSkills(rows);
            setError(null);
          }}
          newRow={(item) => ({
            id: item._id,
            name: item.name,
            level: JOB_SKILL_LEVEL_ENUMS.INTERMEDIATE,
            requirement: JOB_SKILL_REQUIREMENT_ENUMS.REQUIRED,
          })}
          max={JOB_SKILLS_MAX}
          levelHeading="Required Level"
          withRequirement
          required
          error={error}
        />
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
          disabled={isPending}
          className="h-10 px-spacing-xl rounded-lg text-label-sm font-label-sm-strong! text-white bg-bg-brand-solid-primary hover:bg-bg-brand-solid-hover"
        >
          {isPending ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
