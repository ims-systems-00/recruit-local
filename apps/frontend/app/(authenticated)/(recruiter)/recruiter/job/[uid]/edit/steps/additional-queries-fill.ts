import { QUERY_TYPE_ENUMS, type AgentPageActionDefDto } from '@rl/types';
import type { QueryCard } from './additional-queries';

/** One reply's worth: enough for "a few questions", short of a whole form. */
const MAX_QUESTIONS_PER_CALL = 10;
const MAX_QUESTION_CHARS = 500;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 10;
const MAX_OPTION_CHARS = 200;
const MAX_ANSWER_CHARS = 1000;

const TYPES = Object.values(QUERY_TYPE_ENUMS) as string[];

/**
 * Lets Alice add questions to step 5 of the job form. Adds only: editing or
 * removing a question the user wrote stays theirs to do on the card.
 */
export const ADD_JOB_QUESTIONS_ACTION: AgentPageActionDefDto = {
  name: 'add_job_questions',
  description:
    'Add screening questions to the job on this page, after any already there. paragraph and ' +
    `short_answer take a written answer; single_choice and multiple_choice need ${MIN_OPTIONS} to ` +
    `${MAX_OPTIONS} options. Write questions that fit this job — call get_job with the page's jobId ` +
    'if you need its details. expectedAnswer is optional and seen only by the recruiter, never by ' +
    'candidates. Set isRequired only if the user asked. This does not save; the user presses ' +
    "Continue. It can't edit or remove questions already there.",
  parameters: {
    type: 'object',
    properties: {
      questions: {
        type: 'array',
        minItems: 1,
        maxItems: MAX_QUESTIONS_PER_CALL,
        items: {
          type: 'object',
          properties: {
            question: { type: 'string' },
            type: { type: 'string', enum: TYPES },
            options: {
              type: 'array',
              items: { type: 'string' },
              description: 'Choice questions only.',
            },
            isRequired: { type: 'boolean' },
            expectedAnswer: {
              type: 'array',
              items: { type: 'string' },
              description:
                'For a choice question, the option texts you would want picked; for a written one, a single model answer.',
            },
          },
          required: ['question', 'type'],
        },
      },
    },
    required: ['questions'],
  },
};

const isAbsent = (raw: unknown) => raw === undefined || raw === null;

const unusable = (label: string) =>
  new Error(`Alice's ${label} wasn't usable. Ask her to try again.`);

/** The option a model-written answer means, matched loosely, as the option reads. */
const matchOption = (answer: string, options: string[]) =>
  options.find((option) => option.toLowerCase() === answer.toLowerCase());

const parseOptions = (raw: unknown, label: string, isChoice: boolean) => {
  if (!isChoice) {
    if (isAbsent(raw) || (Array.isArray(raw) && raw.length === 0)) return [];
    throw new Error(
      `Alice gave ${label} options, but only a choice question has them. Ask her to try again.`,
    );
  }

  if (!Array.isArray(raw)) throw unusable(`options for ${label}`);

  const options = [
    ...new Set(
      raw.map((option) => (typeof option === 'string' ? option.trim() : '')),
    ),
  ];
  if (options.some((option) => !option || option.length > MAX_OPTION_CHARS)) {
    throw unusable(`options for ${label}`);
  }
  if (options.length < MIN_OPTIONS || options.length > MAX_OPTIONS) {
    throw new Error(
      `Alice's ${label} needs ${MIN_OPTIONS} to ${MAX_OPTIONS} different options.`,
    );
  }

  return options;
};

/**
 * The expected answer as the card stores it: the option text for a single
 * choice, option texts joined by commas for a multiple choice (which is why an
 * expected option may not contain one), and the text itself for a written one.
 */
const parseExpectedAnswer = (
  raw: unknown,
  label: string,
  type: QUERY_TYPE_ENUMS,
  options: string[],
) => {
  if (isAbsent(raw)) return '';
  // A lone answer sent as a string, as models often do, is that one answer.
  const list = typeof raw === 'string' ? [raw] : raw;
  if (
    !Array.isArray(list) ||
    list.some((answer) => typeof answer !== 'string')
  ) {
    throw unusable(`expected answer for ${label}`);
  }

  const answers = [
    ...new Set(
      (list as string[]).map((answer) => answer.trim()).filter(Boolean),
    ),
  ];
  if (answers.length === 0) return '';

  if (
    type === QUERY_TYPE_ENUMS.SINGLE_CHOICE ||
    type === QUERY_TYPE_ENUMS.MULTIPLE_CHOICE
  ) {
    const picked = answers.map((answer) => matchOption(answer, options));
    if (picked.some((option) => option === undefined)) {
      throw new Error(
        `Alice's expected answer for ${label} isn't one of its options. Ask her to try again.`,
      );
    }

    if (type === QUERY_TYPE_ENUMS.SINGLE_CHOICE) {
      if (picked.length > 1) {
        throw new Error(
          `${label[0].toUpperCase()}${label.slice(1)} takes one expected answer, but Alice gave ${picked.length}.`,
        );
      }
      return picked[0] as string;
    }

    if (picked.some((option) => option?.includes(','))) {
      throw new Error(
        `An expected option for ${label} contains a comma, which this form can't store. Ask Alice to reword it.`,
      );
    }
    return picked.join(',');
  }

  if (answers.length > 1) {
    throw new Error(
      `${label[0].toUpperCase()}${label.slice(1)} takes one expected answer, but Alice gave ${answers.length}.`,
    );
  }
  if (answers[0].length > MAX_ANSWER_CHARS) {
    throw new Error(
      `Alice's expected answer for ${label} is too long — the limit is ${MAX_ANSWER_CHARS} characters.`,
    );
  }
  return answers[0];
};

const parseQuestion = (item: unknown, number: number): QueryCard => {
  const { question, type, options, isRequired, expectedAnswer } = (item ??
    {}) as Record<string, unknown>;
  const label = `question ${number}`;

  const text = typeof question === 'string' ? question.trim() : '';
  if (!text) throw unusable(label);
  if (text.length > MAX_QUESTION_CHARS) {
    throw new Error(
      `Alice's ${label} is too long — the limit is ${MAX_QUESTION_CHARS} characters.`,
    );
  }

  if (!TYPES.includes(type as string)) {
    throw new Error(
      `Alice gave ${label} a type that doesn't exist. Ask her to try again.`,
    );
  }
  const queryType = type as QUERY_TYPE_ENUMS;
  const isChoice =
    queryType === QUERY_TYPE_ENUMS.SINGLE_CHOICE ||
    queryType === QUERY_TYPE_ENUMS.MULTIPLE_CHOICE;

  if (!isAbsent(isRequired) && typeof isRequired !== 'boolean') {
    throw unusable(`required setting for ${label}`);
  }

  const optionTexts = parseOptions(options, label, isChoice);

  return {
    id: crypto.randomUUID(),
    question: text,
    type: queryType,
    options: optionTexts.map((option) => ({
      id: crypto.randomUUID(),
      text: option,
    })),
    isRequired: isRequired === true,
    expectedAnswer: parseExpectedAnswer(
      expectedAnswer,
      label,
      queryType,
      optionTexts,
    ),
    focused: false,
  };
};

/**
 * Validates what Alice sent before any of it reaches the page. Throws on the
 * first bad question rather than adding the good ones: the message is shown to
 * the user, and a partial add would leave Alice describing questions that are
 * not there.
 */
export const parseQuestions = (args: Record<string, unknown>): QueryCard[] => {
  const raw = args.questions;
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error("Alice didn't send any questions. Try asking again.");
  }
  if (raw.length > MAX_QUESTIONS_PER_CALL) {
    throw new Error(
      `Alice sent ${raw.length} questions; at most ${MAX_QUESTIONS_PER_CALL} can be added at once.`,
    );
  }

  return raw.map((item, index) => parseQuestion(item, index + 1));
};
