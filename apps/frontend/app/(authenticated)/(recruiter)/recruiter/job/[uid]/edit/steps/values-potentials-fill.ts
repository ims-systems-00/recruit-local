'use client';
import { Dispatch, SetStateAction } from 'react';
import {
  JOB_VALUE_PRIORITY_ENUMS,
  JOB_VALUE_PRIORITY_LABELS,
  JOB_VALUE_PRIORITY_WEIGHT,
  JOB_VALUES_MAX_PER_TYPE,
  JOB_VALUES_MAX_TOTAL,
  VALUE_TYPE_ENUM,
  VALUE_TYPE_LABELS,
} from '@rl/types';
import { usePageAction } from '@/components/ai-chat/page-context';
import { AGENT_STAGGER_MS, prefersReducedMotion, wait } from '@/lib/motion';

const OBJECT_ID = /^[a-f0-9]{24}$/i;

const PRIORITIES = Object.values(JOB_VALUE_PRIORITY_ENUMS) as string[];

/** "essential (x4), highly-important (x3), …", for the model. */
const PRIORITY_GUIDE = Object.values(JOB_VALUE_PRIORITY_ENUMS)
  .map((priority) => `${priority} (x${JOB_VALUE_PRIORITY_WEIGHT[priority]})`)
  .join(', ');

/** A selected value as the step holds it. */
export interface JobValueRow {
  id: string;
  category: VALUE_TYPE_ENUM;
  name: string;
  priority: JOB_VALUE_PRIORITY_ENUMS;
}

interface ValuePick {
  id: string;
  name: string;
  priority?: JOB_VALUE_PRIORITY_ENUMS;
}

/**
 * Validates Alice's picks for one category. The server has already checked
 * each id against this category's catalogue and corrected its name; the
 * priority it passes through unchecked, so it is checked here.
 */
const parsePicks = (args: Record<string, unknown>, label: string) => {
  const raw = args.selections;
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error(`Alice didn't pick any ${label} values. Try asking again.`);
  }

  const seen = new Set<string>();
  const picks: ValuePick[] = [];

  for (const item of raw) {
    const { id, name, priority } = (item ?? {}) as Record<string, unknown>;

    if (
      typeof id !== 'string' ||
      !OBJECT_ID.test(id) ||
      typeof name !== 'string' ||
      !name.trim()
    ) {
      throw new Error(
        `Alice picked a ${label} value that isn't in the catalogue. Ask her to try again.`,
      );
    }
    if (
      priority !== undefined &&
      priority !== null &&
      !PRIORITIES.includes(priority as string)
    ) {
      throw new Error(
        `Alice gave "${name.trim()}" a priority that doesn't exist. Ask her to try again.`,
      );
    }

    if (seen.has(id)) continue;
    seen.add(id);
    picks.push({
      id,
      name: name.trim(),
      priority: (priority ?? undefined) as JOB_VALUE_PRIORITY_ENUMS | undefined,
    });
  }

  if (picks.length > JOB_VALUES_MAX_PER_TYPE) {
    throw new Error(
      `Only ${JOB_VALUES_MAX_PER_TYPE} ${label} values can be chosen.`,
    );
  }

  return picks;
};

/**
 * Lets Alice choose one category's values on the job's values step, each with
 * a priority.
 *
 * One action per category rather than one for the step, because the server
 * checks a catalog action's ids against a single value type: a single action
 * could only be checked loosely, and a mis-copied id from the wrong category
 * would land on the form.
 */
export function useValuesCategoryAction({
  category,
  selected,
  setSelected,
  reveal,
}: {
  category: VALUE_TYPE_ENUM;
  selected: JobValueRow[];
  setSelected: Dispatch<SetStateAction<JobValueRow[]>>;
  /** Opens this category, so the user sees what changed. */
  reveal: () => void;
}) {
  const label = VALUE_TYPE_LABELS[category];

  usePageAction({
    name: `select_values_${category.replace(/-/g, '_')}`,
    description:
      `Choose the ${label} values for this job, replacing the ${label} values already chosen; ` +
      'other categories are left as they are. ' +
      `Use ids from search_catalog with kind "value" and valueType "${category}" — never invent or reuse one. ` +
      `At most ${JOB_VALUES_MAX_PER_TYPE}. Give each a priority if the user said how much it matters: ` +
      `${PRIORITY_GUIDE}. Otherwise leave it out: a value already chosen keeps its priority, a new ` +
      'one starts as essential. This does not save; the user presses Continue.',
    catalog: { kind: 'value', valueType: category },
    parameters: {
      type: 'object',
      properties: {
        selections: {
          type: 'array',
          minItems: 1,
          maxItems: JOB_VALUES_MAX_PER_TYPE,
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'The value id.' },
              name: { type: 'string', description: 'The value name.' },
              priority: { type: 'string', enum: PRIORITIES },
            },
            required: ['id', 'name'],
          },
        },
      },
      required: ['selections'],
    },
    handler: async (args) => {
      const picks = parsePicks(args, label);

      const others = selected.filter((row) => row.category !== category);
      if (others.length + picks.length > JOB_VALUES_MAX_TOTAL) {
        throw new Error(
          `That would make ${others.length + picks.length} values, but a job can have at most ${JOB_VALUES_MAX_TOTAL}.`,
        );
      }

      const rows: JobValueRow[] = picks.map((pick) => ({
        id: pick.id,
        category,
        name: pick.name,
        priority:
          pick.priority ??
          selected.find((row) => row.id === pick.id)?.priority ??
          JOB_VALUE_PRIORITY_ENUMS.ESSENTIAL,
      }));

      reveal();

      // One at a time, as the catalog fields fill in; each slice is a whole
      // selection for the category, so the form is never half-applied.
      const counts = prefersReducedMotion()
        ? [rows.length]
        : rows.map((_, index) => index + 1);
      for (const count of counts) {
        setSelected((prev) => [
          ...prev.filter((row) => row.category !== category),
          ...rows.slice(0, count),
        ]);
        if (count < rows.length) await wait(AGENT_STAGGER_MS);
      }

      return (
        `Selected ${label} values: ` +
        rows
          .map(
            (row) => `${row.name} (${JOB_VALUE_PRIORITY_LABELS[row.priority]})`,
          )
          .join(', ') +
        '.'
      );
    },
  });
}
