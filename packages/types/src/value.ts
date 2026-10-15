export enum VALUE_TYPE_ENUM {
  WORKING_STYLE = 'working-style',
  MINDSET = 'mindset',
  CULTURE_AND_BEHAVIOR = 'culture-and-behavior',
  LEADERSHIP = 'leadership',
  MOTIVATION = 'motivation',
}

/**
 * Display name for each value type — one wording everywhere a type is named:
 * the candidate's value evaluation, the job form's value catalogue, and backend
 * messages about a type.
 */
export const VALUE_TYPE_LABELS: Record<VALUE_TYPE_ENUM, string> = {
  [VALUE_TYPE_ENUM.MINDSET]: 'Mindset',
  [VALUE_TYPE_ENUM.WORKING_STYLE]: 'Working Style',
  [VALUE_TYPE_ENUM.CULTURE_AND_BEHAVIOR]: 'Culture & Behaviour',
  [VALUE_TYPE_ENUM.LEADERSHIP]: 'Leadership',
  [VALUE_TYPE_ENUM.MOTIVATION]: 'Motivation',
};

/**
 * Limits on a candidate's value self-evaluation, shared so the frontend form
 * and the backend validator cannot disagree about what a valid answer is.
 */
export const VALUE_ASSESSMENT_QUESTION_COUNT = 3;
export const VALUE_ANSWER_MIN_LENGTH = 10;
export const VALUE_ANSWER_MAX_LENGTH = 1000;

/**
 * One question of a value's self-evaluation.
 *
 * `key` ("q1".."q3") is the stable address an answer refers to — not a subdoc
 * id — so reseeding the question text never orphans answers already stored.
 */
export interface IValueAssessmentQuestion {
  key: string;
  text: string;
  placeholder?: string;
}

/** The questions a candidate answers to evaluate how strongly they hold a value. */
export interface IValueAssessment {
  /** Shown above the questions, e.g. "Tell us how you grow". */
  heading: string;
  questions: IValueAssessmentQuestion[];
}

export interface IValue {
  type: VALUE_TYPE_ENUM;
  label: string;
  isActive?: boolean;
  assessment?: IValueAssessment;
}

/**
 * Public HTTP shape of a populated value document, as returned embedded in a
 * parent (e.g. a tenant's `values`). ObjectId is a string, dates are ISO, and
 * internal bookkeeping fields are dropped.
 */
export interface ValueResponseDto {
  _id: string;
  type: VALUE_TYPE_ENUM;
  label: string;
  isActive?: boolean;
}

/** HTTP shape of `GET /values/:id/assessment`. */
export interface ValueAssessmentResponseDto {
  _id: string;
  type: VALUE_TYPE_ENUM;
  label: string;
  heading: string;
  questions: IValueAssessmentQuestion[];
}
