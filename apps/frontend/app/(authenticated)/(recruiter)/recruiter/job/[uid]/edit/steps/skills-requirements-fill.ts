'use client';
import {
  JOB_SKILL_LEVEL_ENUMS,
  JOB_SKILL_LEVEL_LABELS,
  JOB_SKILL_REQUIREMENT_ENUMS,
  JOB_SKILL_REQUIREMENT_LABELS,
  JOB_SKILLS_MAX,
} from '@rl/types';
import { usePageAction } from '@/components/ai-chat/page-context';
import { AGENT_STAGGER_MS, prefersReducedMotion, wait } from '@/lib/motion';

const OBJECT_ID = /^[a-f0-9]{24}$/i;

const LEVELS = Object.values(JOB_SKILL_LEVEL_ENUMS) as string[];
const REQUIREMENTS = Object.values(JOB_SKILL_REQUIREMENT_ENUMS) as string[];

/** A selected skill as the step holds it. */
export interface JobSkillRow {
  id: string;
  name: string;
  level: JOB_SKILL_LEVEL_ENUMS;
  requirement: JOB_SKILL_REQUIREMENT_ENUMS;
}

interface SkillPick {
  id: string;
  name: string;
  level?: JOB_SKILL_LEVEL_ENUMS;
  requirement?: JOB_SKILL_REQUIREMENT_ENUMS;
}

const isAbsent = (raw: unknown) => raw === undefined || raw === null;

/**
 * Validates Alice's picks. The server has already checked each id against the
 * skill catalogue and corrected its name; level and requirement it passes
 * through unchecked, so they are checked here.
 */
const parsePicks = (args: Record<string, unknown>) => {
  const raw = args.selections;
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error("Alice didn't pick any skills. Try asking again.");
  }

  const seen = new Set<string>();
  const picks: SkillPick[] = [];

  for (const item of raw) {
    const { id, name, level, requirement } = (item ?? {}) as Record<
      string,
      unknown
    >;

    if (
      typeof id !== 'string' ||
      !OBJECT_ID.test(id) ||
      typeof name !== 'string' ||
      !name.trim()
    ) {
      throw new Error(
        "Alice picked a skill that isn't in the catalogue. Ask her to try again.",
      );
    }
    if (!isAbsent(level) && !LEVELS.includes(level as string)) {
      throw new Error(
        `Alice gave "${name.trim()}" a level that doesn't exist. Ask her to try again.`,
      );
    }
    if (
      !isAbsent(requirement) &&
      !REQUIREMENTS.includes(requirement as string)
    ) {
      throw new Error(
        `Alice gave "${name.trim()}" a requirement that doesn't exist. Ask her to try again.`,
      );
    }

    if (seen.has(id)) continue;
    seen.add(id);
    picks.push({
      id,
      name: name.trim(),
      level: (level ?? undefined) as JOB_SKILL_LEVEL_ENUMS | undefined,
      requirement: (requirement ?? undefined) as
        | JOB_SKILL_REQUIREMENT_ENUMS
        | undefined,
    });
  }

  return picks;
};

/**
 * Lets Alice choose the job's skills, each with the level and requirement the
 * job asks for.
 *
 * Adds by default rather than replacing, unlike the other catalog fields: a job
 * holds up to twenty skills, and replacing would mean resending every one with
 * its id just to add another.
 */
export function useJobSkillsAction({
  skills,
  setSkills,
}: {
  skills: JobSkillRow[];
  setSkills: (rows: JobSkillRow[]) => void;
}) {
  usePageAction({
    name: 'select_job_skills',
    description:
      'Add skills to the job on this page, or change the level or requirement of ones already on it. ' +
      'Pass replace: true only when the user wants the whole list swapped for these. ' +
      'Use ids from search_catalog with kind "skill" — never invent or reuse one. ' +
      `At most ${JOB_SKILLS_MAX} skills in total. Set level and requirement only from what the user ` +
      'said; left out, a skill already on the job keeps its own and a new one starts as intermediate ' +
      'and required. This does not save; the user presses Continue.',
    catalog: { kind: 'skill' },
    parameters: {
      type: 'object',
      properties: {
        selections: {
          type: 'array',
          minItems: 1,
          maxItems: JOB_SKILLS_MAX,
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'The skill id.' },
              name: { type: 'string', description: 'The skill name.' },
              level: { type: 'string', enum: LEVELS },
              requirement: {
                type: 'string',
                enum: REQUIREMENTS,
                description:
                  'required: a candidate must have it; preferred: it only counts in their favour.',
              },
            },
            required: ['id', 'name'],
          },
        },
        replace: {
          type: 'boolean',
          description: 'Swap the whole list for these. Default false: add.',
        },
      },
      required: ['selections'],
    },
    handler: async (args) => {
      const picks = parsePicks(args);
      const replace = args.replace === true;

      // Each step adds or updates one skill, so the list visibly fills in.
      const states: JobSkillRow[][] = [];
      let rows: JobSkillRow[] = replace ? [] : skills;
      for (const pick of picks) {
        const existing = skills.find((row) => row.id === pick.id);
        const row: JobSkillRow = {
          id: pick.id,
          name: pick.name,
          level:
            pick.level ?? existing?.level ?? JOB_SKILL_LEVEL_ENUMS.INTERMEDIATE,
          requirement:
            pick.requirement ??
            existing?.requirement ??
            JOB_SKILL_REQUIREMENT_ENUMS.REQUIRED,
        };
        rows = rows.some((current) => current.id === row.id)
          ? rows.map((current) => (current.id === row.id ? row : current))
          : [...rows, row];
        states.push(rows);
      }

      if (rows.length > JOB_SKILLS_MAX) {
        throw new Error(
          `That would make ${rows.length} skills, but a job can have at most ${JOB_SKILLS_MAX}.`,
        );
      }

      for (const [index, state] of (prefersReducedMotion()
        ? [rows]
        : states
      ).entries()) {
        setSkills(state);
        if (index < states.length - 1 && !prefersReducedMotion()) {
          await wait(AGENT_STAGGER_MS);
        }
      }

      const applied = rows.filter((row) =>
        picks.some((pick) => pick.id === row.id),
      );
      return (
        `${replace ? 'Set the skills to' : 'Added or updated'} ` +
        applied
          .map(
            (row) =>
              `${row.name} (${JOB_SKILL_LEVEL_LABELS[row.level]}, ${JOB_SKILL_REQUIREMENT_LABELS[row.requirement]})`,
          )
          .join(', ') +
        '.'
      );
    },
  });
}
