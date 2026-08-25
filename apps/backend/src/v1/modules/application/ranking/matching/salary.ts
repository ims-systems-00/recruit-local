import { PERIOD_ENUMS } from "@rl/types";

/**
 * Salary matching.
 *
 * The job states a budget — `Job.salary` with a `Job.period` saying what that
 * number covers ("50000 yearly", "22 hourly"). The candidate states what they
 * want on the application — `Application.expectedSalary`. The question is
 * whether the two can meet.
 *
 * Scored on the same shape as the experience matcher: inside the band is full
 * marks, outside it decays exponentially. Only the directions differ.
 *
 * - **At or below the budget** — affordable. Full marks, and no attempt is made
 *   to read anything into a candidate asking for less. Under-asking is not a
 *   defect and is not scored as one.
 * - **A little above** — normal. Nobody expects an advertised figure to be the
 *   final one, so a negotiation margin scores full marks too.
 * - **Well above** — decays, and unlike the experience matcher it decays to
 *   nothing rather than to a floor. An overqualified candidate can still do the
 *   job, which is why `matchExperience` never drops them below 0.5. A candidate
 *   who wants twice the budget cannot be hired at all, so there is no floor to
 *   hold here.
 *
 * Overshoot is measured in proportion, not currency. Asking £5k over on a £50k
 * job and £5k over on a £15k job are not the same event, and a single absolute
 * tolerance would have to be wrong for one of them.
 *
 * **`Application.currentSalary` is deliberately not read here, and should not
 * be added.** What someone is paid today is a function of who has employed them
 * so far, and ranking on it carries pay inequity forward into who gets seen.
 * Several jurisdictions restrict asking for it at all. The field exists on the
 * model; ranking is not a place to spend it.
 */

export interface SalaryMatchOptions {
  /**
   * Fraction over the advertised figure that still scores full marks — ordinary
   * negotiating room. Default 0.1 (10%).
   */
  negotiableBand?: number;
  /**
   * Fraction of overshoot beyond the band at which the score has decayed to
   * roughly a third. Smaller punishes expensive candidates harder. Default 0.25.
   */
  tolerance?: number;
  /**
   * How far apart the two figures may be before they are treated as quoted in
   * different periods rather than as a real disagreement. Default 12.
   */
  implausibleFactor?: number;
}

export interface SalaryMatchResult {
  /**
   * 0-1, unrounded. Presentation is the pipeline's business — it applies
   * `RANKING_SCALE` and rounds, once.
   */
  ratio: number;
  /**
   * False when the comparison cannot be made: the job named no salary, the
   * candidate named no expectation, or the two figures are so far apart that
   * they are almost certainly quoted in different periods. `ratio` is
   * meaningless then and the caller should drop this signal.
   */
  applicable: boolean;
  /** What the job advertised, or null when it advertised nothing. */
  offered: number | null;
  /** What the candidate asked for, or null when they asked for nothing. */
  expected: number | null;
  /** The period the job's figure is quoted in, assumed to cover both sides. */
  period: PERIOD_ENUMS | null;
  /** How far over the budget the expectation sits, as a fraction. 0 when within. */
  overshoot: number;
  /** Where the expectation sits relative to the budget. */
  standing: "within" | "over" | "unknown";
}

const DEFAULTS: Required<SalaryMatchOptions> = { negotiableBand: 0.1, tolerance: 0.25, implausibleFactor: 12 };

const isAmount = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;

/**
 * Scores a candidate's salary expectation against what the job advertised.
 *
 * Pure and synchronous — it does no database work of its own.
 *
 * Both figures are assumed to be quoted in the job's `period`. That assumption
 * is forced: `Application.expectedSalary` is a bare number with no period of its
 * own, so there is nothing else to read it against. `implausibleFactor` is the
 * safety valve — when the gap is too wide to be a real disagreement, the signal
 * is dropped rather than scored, because burying a good candidate over a units
 * mix-up is a far worse failure than not scoring them on salary at all.
 *
 * @param offered The job's `salary`.
 * @param period The job's `period`, carried through for reporting.
 * @param expected The application's `expectedSalary`.
 */
export const matchSalary = (
  offered: number | null | undefined,
  period: PERIOD_ENUMS | null | undefined,
  expected: number | null | undefined,
  options: SalaryMatchOptions = {}
): SalaryMatchResult => {
  const { negotiableBand, tolerance, implausibleFactor } = { ...DEFAULTS, ...options };

  const empty: SalaryMatchResult = {
    ratio: 0,
    applicable: false,
    offered: isAmount(offered) ? offered : null,
    expected: isAmount(expected) ? expected : null,
    period: period ?? null,
    overshoot: 0,
    standing: "unknown",
  };

  // One side put no number on it.
  if (!isAmount(offered) || !isAmount(expected)) return empty;

  // Too far apart in either direction to be a disagreement about money — far
  // more likely one side was quoted per year and the other per month.
  const spread = expected / offered;
  if (spread >= implausibleFactor || spread <= 1 / implausibleFactor) return empty;

  const ceiling = offered * (1 + negotiableBand);
  if (expected <= ceiling) return { ...empty, ratio: 1, applicable: true, standing: "within" };

  const overshoot = (expected - offered) / offered;
  // Exponential decay past the negotiable band, so each further step over the
  // budget costs more than the last.
  const ratio = Math.exp(-(overshoot - negotiableBand) / tolerance);

  return { ...empty, ratio, applicable: true, overshoot, standing: "over" };
};
