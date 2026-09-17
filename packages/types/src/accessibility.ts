/**
 * Per-user accessibility preferences.
 *
 * These describe how the platform should communicate with someone, and they are
 * stored on the user rather than on a profile because they follow the person,
 * not the role they are playing. A recruiter who needs plain language needs it
 * on the hiring screens too.
 *
 * Two audiences read them. The agent folds the wording preferences into its
 * system prompt, so it writes differently for the rest of the conversation. The
 * frontend reads the presentation ones — a page cannot ask the server to speak.
 *
 * Every field is opt-in and defaults to off, which is the honest default: an
 * assumed accommodation is still an assumption about somebody.
 */

/**
 * How much detail an answer should carry.
 *
 * Separate from `plainLanguage` because they are genuinely different requests.
 * Plain language is about the words; this is about how many of them. Someone
 * with a reading difficulty often wants simple wording *and* the full answer;
 * someone using a screen reader often wants ordinary wording and far less of it.
 */
export enum ANSWER_LENGTH {
  BRIEF = 'brief',
  NORMAL = 'normal',
  DETAILED = 'detailed',
}

export interface AccessibilityPreferences {
  /**
   * Short sentences, everyday words, no recruitment jargon. Expands an
   * abbreviation the first time it appears.
   */
  plainLanguage: boolean;

  /** How long an answer should be. */
  answerLength: ANSWER_LENGTH;

  /**
   * Ask one question per turn instead of presenting a list.
   *
   * The preference that most changes how the agent behaves rather than how it
   * writes: a setup walkthrough becomes a sequence of single questions, which is
   * the difference between usable and unusable for anyone who cannot hold four
   * questions in their head at once.
   */
  oneQuestionAtATime: boolean;

  /**
   * Read every assistant reply aloud without being asked.
   *
   * A client-side setting the server only stores. Nothing on the backend acts on
   * it — the page decides when to request speech.
   */
  autoReadAloud: boolean;

  /**
   * Preferred voice for read-aloud, as a value the speech endpoint accepts.
   * Null means whatever the endpoint's default is.
   */
  voice: string | null;

  /**
   * Playback rate for read-aloud, where 1 is normal speed.
   *
   * Frequently the first thing a regular screen-reader user changes, and
   * frequently the thing an interface forgets between visits.
   */
  speechRate: number;
}

/**
 * What a user has before they have ever set anything.
 *
 * Exported rather than inlined into the schema so the agent, the API and the
 * frontend all describe the unset state identically — a default that exists in
 * three places is a default that disagrees with itself eventually.
 */
export const DEFAULT_ACCESSIBILITY_PREFERENCES: AccessibilityPreferences = {
  plainLanguage: false,
  answerLength: ANSWER_LENGTH.NORMAL,
  oneQuestionAtATime: false,
  autoReadAloud: false,
  voice: null,
  speechRate: 1,
};

/** Bounds for `speechRate`, applied wherever it is accepted. */
export const SPEECH_RATE_MIN = 0.5;
export const SPEECH_RATE_MAX = 2;
