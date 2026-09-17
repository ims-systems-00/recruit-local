'use client';
import {
  usePageAction,
  usePageContext,
} from '@/components/ai-chat/page-context';

/**
 * Makes a catalog-based personalisation step (job title, industry, experience
 * level, work mode) visible to Alice, and lets her tick options on it.
 *
 * The action only changes form state. The user still presses the step's Next
 * button, which runs the page's normal submit — so the save, the onboarding
 * step and the navigation all stay exactly as they are without Alice.
 *
 * Arguments carry names as well as ids because the "Selected:" chips render
 * names, and a chosen option may not be in the currently loaded page of the
 * list. Both come from `search_catalog`, which is the only source the prompt
 * allows.
 */

const OBJECT_ID = /^[a-f0-9]{24}$/i;

export interface CatalogOption {
  _id: string;
  name: string;
}

interface Options {
  /** `candidate.onboarding.<step>` suffix and the `search_catalog` kind. */
  kind: 'job_title' | 'industry' | 'experience_level' | 'work_mode';
  /** Plural label used in prompts and messages, e.g. "job titles". */
  label: string;
  /** What the step asks, in a sentence. */
  question: string;
  /** Max selections; 1 means a single choice. */
  max: number;
  /** Currently selected options, for the page state Alice sees. */
  selected: CatalogOption[];
  /** Applies a validated selection to the form. */
  apply: (options: CatalogOption[]) => void;
}

const parseSelections = (
  args: Record<string, unknown>,
  max: number,
  label: string,
) => {
  const raw = args.selections;
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error(`Alice didn't pick any ${label}. Try asking again.`);
  }

  const seen = new Set<string>();
  const options: CatalogOption[] = [];

  for (const item of raw) {
    const id = (item as { id?: unknown })?.id;
    const name = (item as { name?: unknown })?.name;
    if (
      typeof id !== 'string' ||
      !OBJECT_ID.test(id) ||
      typeof name !== 'string' ||
      !name.trim()
    ) {
      throw new Error(
        `Alice sent a ${label} choice this page doesn't recognise.`,
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
  label,
  question,
  max,
  selected,
  apply,
}: Options) {
  const single = max === 1;

  usePageContext({
    page: `candidate.onboarding.${kind}`,
    summary:
      `Candidate setup step: "${question}" The user ${single ? 'chooses one' : `chooses up to ${max}`} ` +
      `from a list of ${label}, then presses Next to save and continue.`,
    state: {
      selected: selected.map((option) => option.name),
      limit: max,
      catalogKind: kind,
    },
  });

  usePageAction({
    name: `select_${kind}`,
    description:
      `Select ${label} in the list on this page, replacing the current selection. ` +
      `Get options from search_catalog with kind "${kind}" first. Pass options the user chose, or — if they ` +
      'explicitly asked you to choose — the best fits for what they told you, without asking them to confirm first. ' +
      (single ? 'Pass exactly one.' : `Pass at most ${max}.`) +
      ' This does not save; the user presses Next on the page to save.',
    parameters: {
      type: 'object',
      properties: {
        selections: {
          type: 'array',
          minItems: 1,
          maxItems: max,
          description:
            'The chosen options, exactly as search_catalog returned them.',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'The option id from search_catalog.',
              },
              name: {
                type: 'string',
                description: 'The option name from search_catalog.',
              },
            },
            required: ['id', 'name'],
          },
        },
      },
      required: ['selections'],
    },
    handler: (args) => {
      const options = parseSelections(args, max, label);
      apply(options);
      return `Selected ${options.map((option) => option.name).join(', ')}.`;
    },
  });
}
