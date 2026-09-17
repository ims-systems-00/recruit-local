/**
 * Shared shapes for the help knowledge base — the store the agent answers
 * "how does Recruit Local work?" from.
 *
 * Help content is product documentation, not user data: every reader of a given
 * audience sees byte-identical text, and no article is derived from anyone's
 * records. That is why these shapes carry no ownership fields and why the
 * search tool filters by audience rather than by a CASL condition.
 */

/**
 * Who an article is written for.
 *
 * `EVERYONE` is not a fallback for "unclassified" — it means the answer is
 * genuinely the same for both sides of the marketplace (what a KYC check is,
 * how to reset a password). An article that explains a candidate's screen to an
 * employer is worse than no article, so the default when writing one is to pick
 * a side.
 */
export enum HELP_ARTICLE_AUDIENCE {
  EVERYONE = 'everyone',
  CANDIDATE = 'candidate',
  EMPLOYER = 'employer',
}

/**
 * Coarse grouping, used to let the agent pull a whole topic when a user asks an
 * open question ("how do I get started?") rather than a specific one.
 */
export enum HELP_ARTICLE_TOPIC {
  GETTING_STARTED = 'getting_started',
  ACCOUNT = 'account',
  PROFILE = 'profile',
  JOBS = 'jobs',
  APPLICATIONS = 'applications',
  HIRING = 'hiring',
  VERIFICATION = 'verification',
  ACCESSIBILITY = 'accessibility',
}

/** One article as the search tool hands it to the model. */
export interface HelpArticleDto {
  slug: string;
  title: string;
  topic: HELP_ARTICLE_TOPIC;
  audience: HELP_ARTICLE_AUDIENCE;
  summary: string;
  body: string;
}
