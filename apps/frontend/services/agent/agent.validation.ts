import * as yup from 'yup';
import { ANSWER_LENGTH, SPEECH_RATE_MAX, SPEECH_RATE_MIN } from '@rl/types';

export const agentConversationCreateSchema = yup.object({
  instruction: yup.string().required('Instruction is required'),
});

/** Mirrors the backend's 4,000-character cap so an overlong read fails here. */
export const speechSchema = yup.object({
  text: yup.string().trim().required('Text is required').max(4000),
  voice: yup.string().optional(),
  speed: yup.number().min(SPEECH_RATE_MIN).max(SPEECH_RATE_MAX).optional(),
});

export const accessibilityPreferencesSchema = yup.object({
  plainLanguage: yup.boolean().optional(),
  answerLength: yup.string().oneOf(Object.values(ANSWER_LENGTH)).optional(),
  oneQuestionAtATime: yup.boolean().optional(),
  autoReadAloud: yup.boolean().optional(),
  voice: yup.string().nullable().optional(),
  speechRate: yup.number().min(SPEECH_RATE_MIN).max(SPEECH_RATE_MAX).optional(),
});
