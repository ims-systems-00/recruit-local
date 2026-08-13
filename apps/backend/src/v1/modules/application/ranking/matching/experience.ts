/**
 * Experience matching.
 *
 * The two sides state experience differently. A job names a number —
 * `Job.yearOfExperience`, "we want 5 years". A candidate names a level —
 * `JobProfile.experienceLevel`, a reference into the shared `ExperienceLevel`
 * catalog. The bridge is the span of years each level carries (`minYears` to
 * `maxYears`), which is what makes the comparison possible at all; a level with
 * no span cannot be scored and the signal is dropped rather than guessed at.
 *
 * A level is a range, not a point, so the question is where the job's
 * requirement falls relative to the candidate's band:
 *
 * - **Inside it** — the candidate is exactly who the job asked for. Full marks.
 * - **Above it** — the candidate is short by the gap between their ceiling and
 *   the requirement. Decays quickly: someone with one year applying for a
 *   five-year role is a genuine mismatch, and each further year of shortfall
 *   hurts more than the last.
 * - **Below it** — the candidate is over by the gap between the requirement and
 *   their floor. Decays slowly and never below a floor of its own, because an
 *   overqualified candidate can still do the job. It is a flag for a recruiter
 *   to weigh, not a reason to bury them under people who cannot.
 *
 * That asymmetry is the whole point: distance in the two directions does not
 * mean the same thing, so it is not scored the same way.
 *
 * Nothing here reads the database — hand it the job's requirement and the
 * candidate's already-populated level.
 */

/**
 * The shape this matcher needs off an experience level. Deliberately loose so it
 * accepts a populated Mongoose subdocument, a `.lean()` result, or an
 * aggregation projection without the caller reshaping first.
 */
export interface MatchableExperienceLevel {
  _id?: unknown;
  name?: string;
  /** Bottom of the band, in years. Absent or null reads as 0. */
  minYears?: number | null;
  /** Top of the band, in years. Absent or null is open-ended ("15+"). */
  maxYears?: number | null;
}

export interface ExperienceMatchOptions {
  /**
   * Years of shortfall at which an underqualified candidate has decayed to
   * roughly a third of full marks. Smaller punishes inexperience harder.
   * Default 2.
   */
  underTolerance?: number;
  /**
   * Years of excess at which an overqualified candidate has fallen halfway to
   * `overFloor`. Larger is more forgiving of seniority. Default 8.
   */
  overTolerance?: number;
  /**
   * The lowest an overqualified candidate can score, however far over they are.
   * They can still do the job, so this never reaches 0. Default 0.5.
   */
  overFloor?: number;
}

/** The candidate's band, normalized. `max` null means open-ended. */
export interface ExperienceBand {
  min: number;
  max: number | null;
}

export interface ExperienceMatchResult {
  /**
   * 0-1, unrounded. Presentation is the pipeline's business — it applies
   * `RANKING_SCALE` and rounds, once.
   */
  ratio: number;
  /**
   * False when the comparison cannot be made: the job named no requirement, the
   * candidate set no level, or the level carries no span of years. `ratio` is
   * meaningless then and the caller should drop this signal rather than average
   * in a zero.
   */
  applicable: boolean;
  /** Years the job asked for, or null when it asked for nothing. */
  required: number | null;
  /** The candidate's band, or null when they have no usable level. */
  band: ExperienceBand | null;
  /** Where the requirement sits relative to the band. */
  standing: "meets" | "under" | "over" | "unknown";
  /** Years short of the requirement. 0 unless `standing` is "under". */
  shortfall: number;
  /** Years beyond the requirement. 0 unless `standing` is "over". */
  excess: number;
  /** The level's name, for explaining the score back to a recruiter. */
  level: string | null;
}

const DEFAULTS: Required<ExperienceMatchOptions> = { underTolerance: 2, overTolerance: 8, overFloor: 0.5 };

const isYear = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;

/**
 * Reads a level's span into a usable band. A missing floor is 0 — "up to three
 * years" starts at nothing. A missing ceiling is open-ended. A level with
 * neither is not a band at all, which is what makes the whole signal
 * inapplicable. An inverted band is bad data rather than meaning, so it is
 * swapped rather than rejected.
 */
const bandOf = (level: MatchableExperienceLevel | null | undefined): ExperienceBand | null => {
  if (!level) return null;

  const hasMin = isYear(level.minYears);
  const hasMax = isYear(level.maxYears);
  if (!hasMin && !hasMax) return null;

  const min = hasMin ? (level.minYears as number) : 0;
  const max = hasMax ? (level.maxYears as number) : null;
  if (max !== null && max < min) return { min: max, max: min };

  return { min, max };
};

/**
 * Scores how well a candidate's experience level answers a job's stated
 * requirement.
 *
 * Pure and synchronous — hand it an already-populated level; it does no database
 * work of its own.
 *
 * @param requiredYears The job's `yearOfExperience`.
 * @param level The candidate's `JobProfile.experienceLevel`, populated.
 */
export const matchExperience = (
  requiredYears: number | null | undefined,
  level: MatchableExperienceLevel | null | undefined,
  options: ExperienceMatchOptions = {}
): ExperienceMatchResult => {
  const { underTolerance, overTolerance, overFloor } = { ...DEFAULTS, ...options };

  const band = bandOf(level);
  const name = typeof level?.name === "string" && level.name.trim() ? level.name.trim() : null;

  const empty: ExperienceMatchResult = {
    ratio: 0,
    applicable: false,
    // A requirement of 0 years is a real requirement, not a missing one.
    required: isYear(requiredYears) ? requiredYears : null,
    band,
    standing: "unknown",
    shortfall: 0,
    excess: 0,
    level: name,
  };

  // The job never said what it wanted, or the candidate's level carries no span
  // of years to compare it to.
  if (!isYear(requiredYears) || !band) return empty;

  const required = requiredYears;
  const { min, max } = band;

  // The requirement falls inside the candidate's band: exactly who was asked for.
  if (required >= min && (max === null || required <= max)) {
    return { ...empty, ratio: 1, applicable: true, standing: "meets" };
  }

  if (max !== null && required > max) {
    const shortfall = required - max;
    // Exponential decay, so each further year short costs more than the last.
    const ratio = Math.exp(-shortfall / underTolerance);
    return { ...empty, ratio, applicable: true, standing: "under", shortfall };
  }

  const excess = min - required;
  // Decays toward a floor rather than toward zero — an overqualified candidate
  // is still a candidate who can do the job.
  const ratio = overFloor + (1 - overFloor) * Math.exp(-excess / overTolerance);
  return { ...empty, ratio, applicable: true, standing: "over", excess };
};
