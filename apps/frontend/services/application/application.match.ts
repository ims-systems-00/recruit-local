import { APPLICATION_MATCH_PART_ENUMS, MATCH_SCORE_SCALE } from '@rl/types';
import { Application } from './application.type';

type MatchFields = Pick<Application, 'matchScore' | 'matchBreakdown'>;

/** A score out of `MATCH_SCORE_SCALE` as a whole percentage; none stays null. */
export const toMatchPercent = (
  score: number | null | undefined,
): number | null =>
  score == null ? null : Math.round((score / MATCH_SCORE_SCALE) * 100);

/**
 * The overall match as a percentage, or null until the ranking queue has scored
 * the application. Every application starts at a `matchScore` of 0, so it is
 * `matchBreakdown`, written alongside the real score, that marks one as scored.
 */
export const overallMatchPercent = (
  application?: MatchFields | null,
): number | null =>
  application?.matchBreakdown ? toMatchPercent(application.matchScore) : null;

/**
 * One part's match as a percentage, or null when the application is not scored
 * yet or the job gave that part nothing to compare.
 */
export const partMatchPercent = (
  application: MatchFields | null | undefined,
  key: APPLICATION_MATCH_PART_ENUMS,
): number | null =>
  toMatchPercent(
    application?.matchBreakdown?.find((part) => part.key === key)?.score,
  );

/** A match percentage for display: "84%", or "—" when there is none. */
export const formatMatchPercent = (percent: number | null): string =>
  percent == null ? '—' : `${percent}%`;
