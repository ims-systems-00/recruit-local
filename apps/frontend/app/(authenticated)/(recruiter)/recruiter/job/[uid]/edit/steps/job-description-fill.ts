import { UseFormSetValue } from 'react-hook-form';
import { genKey, RawDraftContentState } from 'draft-js';
import {
  REQUIRED_DOCUMENTS_ENUMS,
  type AgentPageActionDefDto,
} from '@rl/types';
import { JobDescriptionFormValues } from '../job.schema';

/**
 * Lets Alice fill in step 2 of the job form. Attachments are left out: they are
 * file uploads, which only the user can make.
 */
export const FILL_JOB_DESCRIPTION_ACTION: AgentPageActionDefDto = {
  name: 'fill_job_description',
  description:
    'Fill in the job description step the user has open: about the role, key responsibilities, and ' +
    'which documents applicants must send. Pass only the fields being changed; each replaces what is ' +
    'there. Write from what the user told you; do not invent pay, benefits or requirements they did ' +
    "not mention. This does not save; the user presses Continue. It can't add attachments.",
  parameters: {
    type: 'object',
    properties: {
      description: {
        type: 'string',
        description:
          'About the role, as plain text. A new line starts a paragraph; "- " starts a bullet.',
      },
      responsibility: {
        type: 'string',
        description: 'Key responsibilities, one per line, each starting "- ".',
      },
      requiredDocuments: {
        type: 'array',
        items: {
          type: 'string',
          enum: Object.values(REQUIRED_DOCUMENTS_ENUMS),
        },
        description:
          'Documents applicants must send. Replaces the current selection.',
      },
    },
    additionalProperties: false,
  },
};

const SET_OPTIONS = {
  shouldDirty: true,
  shouldTouch: true,
  shouldValidate: true,
} as const;

/** Generous for a job ad, and well inside what the editor handles. */
const MAX_TEXT_CHARS = 5000;

const BULLET = /^\s*[-•*]\s+/;

/**
 * Plain text as the editor's stored value: one block per line, and a line
 * starting "- " as a bullet, so a list of responsibilities reads as a list.
 */
export const textToDraft = (text: string): string => {
  const raw: RawDraftContentState = {
    blocks: text.split('\n').map((line) => {
      const bullet = BULLET.exec(line);
      return {
        key: genKey(),
        text: bullet ? line.slice(bullet[0].length) : line,
        type: bullet ? 'unordered-list-item' : 'unstyled',
        depth: 0,
        inlineStyleRanges: [],
        entityRanges: [],
        data: {},
      };
    }),
    entityMap: {},
  };

  return JSON.stringify(raw);
};

/** The editor's stored value as plain text, for what Alice is told. */
export const draftToText = (value?: string | null): string | null => {
  if (!value) return null;

  try {
    const raw = JSON.parse(value) as Partial<RawDraftContentState>;
    return (raw.blocks ?? []).map((block) => block.text).join('\n');
  } catch {
    // Saved before the editor was used, so already plain text.
    return value;
  }
};

/** One field to fill; see `JobBasicsFill`. */
export interface JobDescriptionFill {
  label: string;
  apply: (setValue: UseFormSetValue<JobDescriptionFormValues>) => void;
}

const unusable = (label: string) =>
  new Error(`Alice's ${label} wasn't usable. Ask her to try again.`);

const readText = (raw: unknown, label: string) => {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== 'string') throw unusable(label);

  const value = raw.trim();
  if (!value) return undefined;
  if (value.length > MAX_TEXT_CHARS) {
    throw new Error(
      `Alice's ${label} is too long — the limit is ${MAX_TEXT_CHARS} characters.`,
    );
  }

  return value;
};

/**
 * Validates what Alice sent before any of it reaches the form. Throws rather
 * than dropping a bad field, as `parseJobBasics` does.
 */
export const parseJobDescription = (
  args: Record<string, unknown>,
): JobDescriptionFill[] => {
  const fills: JobDescriptionFill[] = [];

  const description = readText(args.description, 'role description');
  if (description !== undefined) {
    fills.push({
      label: 'about the role',
      apply: (set) => set('description', textToDraft(description), SET_OPTIONS),
    });
  }

  const responsibility = readText(
    args.responsibility,
    'list of responsibilities',
  );
  if (responsibility !== undefined) {
    fills.push({
      label: 'key responsibilities',
      apply: (set) =>
        set('responsibility', textToDraft(responsibility), SET_OPTIONS),
    });
  }

  if (args.requiredDocuments !== undefined && args.requiredDocuments !== null) {
    if (!Array.isArray(args.requiredDocuments)) {
      throw unusable('list of required documents');
    }

    const options = Object.values(REQUIRED_DOCUMENTS_ENUMS) as string[];
    if (args.requiredDocuments.some((doc) => !options.includes(doc))) {
      throw unusable('list of required documents');
    }

    const documents = [
      ...new Set(args.requiredDocuments as REQUIRED_DOCUMENTS_ENUMS[]),
    ];
    fills.push({
      label: 'required documents',
      apply: (set) => set('requiredDocuments', documents, SET_OPTIONS),
    });
  }

  return fills;
};
