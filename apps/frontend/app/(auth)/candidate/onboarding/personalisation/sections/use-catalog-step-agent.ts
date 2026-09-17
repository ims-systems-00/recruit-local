'use client';
import {
  usePageAction,
  usePageContext,
} from '@/components/ai-chat/page-context';
import type { AgentCatalogKind } from '@rl/types';

/**
 * Makes a catalog-based setup step (job title, industry, experience level, work
 * mode, or a workplace-values round) visible to Alice, and lets her tick options
 * on it.
 *
 * The action only changes form state. The user still presses the step's
 * Continue button, which runs the page's normal submit — so the save, the
 * onboarding step and the navigation all stay exactly as they are without Alice.
 *
 * Two guards stop an invented id reaching the form:
 * - The action declares its `catalog`, so the server checks every id against
 *   that catalog before the action is sent here, and corrects the names.
 * - When the page has its whole option list loaded, it passes `knownIds` and the
 *   handler refuses anything outside it — the check that would have caught an
 *   id that ticks nothing and then gets saved.
 */

const OBJECT_ID = /^[a-f0-9]{24}$/i;

export interface CatalogOption {
  _id: string;
  name: string;
}

interface Options {
  kind: AgentCatalogKind;
  /** Required for `value`: the value type of this round. */
  valueType?: string;
  /** Page id suffix; defaults to the kind. Values rounds pass their step. */
  pageId?: string;
  /** Plural label used in prompts and messages, e.g. "job titles". */
  label: string;
  /** What the step asks, in a sentence. */
  question: string;
  /** Max selections; 1 means a single choice. */
  max: number;
  /** Currently selected options, for the page state Alice sees. */
  selected: CatalogOption[];
  /**
   * Every option id this page can show, when the full list is loaded. When set,
   * ids outside it are rejected. Omit for long, paginated lists.
   */
  knownIds?: string[];
  /**
   * Options to show Alice directly, for short lists. Saves her a search and
   * gives her real ids up front. Keep it small: page state is size-capped.
   */
  visibleOptions?: CatalogOption[];
  /** Extra facts about the page worth telling Alice, e.g. popular choices. */
  extraState?: Record<string, unknown>;
  /** Applies a validated selection to the form. */
  apply: (options: CatalogOption[]) => void;
}

const parseSelections = (
  args: Record<string, unknown>,
  max: number,
  label: string,
  knownIds?: string[],
) => {
  const raw = args.selections;
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error(`Alice didn't pick any ${label}. Try asking again.`);
  }

  const known = knownIds ? new Set(knownIds) : null;
  const seen = new Set<string>();
  const options: CatalogOption[] = [];

  for (const item of raw) {
    const id = (item as { id?: unknown })?.id;
    const name = (item as { name?: unknown })?.name;
    if (
      typeof id !== 'string' ||
      !OBJECT_ID.test(id) ||
      typeof name !== 'string' ||
      !name.trim() ||
      (known && !known.has(id))
    ) {
      throw new Error(
        `Alice picked a ${label.replace(/s$/, '')} that isn't in this list. Ask her to try again.`,
      );
    }
    if (seen.has(id)) continue;
    seen.add(id);
    options.push({ _id: id, name: name.trim() });
  }

  if (options.length > max) {
    throw new Error(
      max === 1
        ? `Only one ${label.replace(/s$/, '')} can be chosen here.`
        : `Only ${max} ${label} can be chosen here.`,
    );
  }

  return options;
};

export function useCatalogStepAgent({
  kind,
  valueType,
  pageId,
  label,
  question,
  max,
  selected,
  knownIds,
  visibleOptions,
  extraState,
  apply,
}: Options) {
  const single = max === 1;
  const searchHint =
    kind === 'value'
      ? `search_catalog with kind "value" and valueType "${valueType}"`
      : `search_catalog with kind "${kind}"`;

  usePageContext({
    page: `candidate.onboarding.${pageId ?? kind}`,
    // Question trimmed so the summary stays inside the server's size cap.
    summary:
      `Candidate setup step: "${question.slice(0, 120)}" The user ${single ? 'chooses one' : `chooses up to ${max}`} ` +
      `${label}, then presses Continue to save.`,
    state: {
      selected: selected.map((option) => option.name),
      limit: max,
      searchWith: searchHint,
      ...(valueType ? { valueType } : {}),
      ...(visibleOptions?.length
        ? {
            options: visibleOptions.map((option) => ({
              id: option._id,
              name: option.name,
            })),
          }
        : {}),
      ...extraState,
    },
  });

  usePageAction({
    name: `select_${kind}`,
    description:
      `Select ${label} on this page, replacing the current selection. ` +
      `Use ids from ${searchHint} (or the page's listed options) — never invent or reuse one. ` +
      'Pass options the user chose, or, if they explicitly asked you to choose, the best fits for what they told you. ' +
      (single ? 'Pass exactly one.' : `Pass at most ${max}.`) +
      ' This does not save; the user presses Continue.',
    catalog: { kind, ...(valueType ? { valueType } : {}) },
    parameters: {
      type: 'object',
      properties: {
        selections: {
          type: 'array',
          minItems: 1,
          maxItems: max,
          description: 'The chosen options, with ids exactly as returned.',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'The option id.' },
              name: { type: 'string', description: 'The option name.' },
            },
            required: ['id', 'name'],
          },
        },
      },
      required: ['selections'],
    },
    handler: (args) => {
      const options = parseSelections(args, max, label, knownIds);
      apply(options);
      return `Selected ${options.map((option) => option.name).join(', ')}.`;
    },
  });
}
