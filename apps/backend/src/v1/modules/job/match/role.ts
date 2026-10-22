import assert from "assert";
import { buildKeywords } from "../../../../common/helper/keywords";

/**
 * Role matching: whether the job is the kind of role the candidate is after.
 *
 * The job's side is the words of its title and category; the candidate's is
 * the words of the job titles and industries they picked and their interests.
 * The ratio is the share of the job's words the candidate's words contain, so a
 * candidate after "Data Scientist" fully covers a "Senior Data Scientist" job,
 * and one after "Backend Developer" half-covers a "Frontend Developer" one.
 *
 * Words that say how senior a job is or how it is arranged ("senior", "junior",
 * "part-time", "locum") are left out of the job's side. They do not say what
 * the work is, and skill levels and work mode already score them; kept in, they
 * would match unrelated jobs that happen to share a seniority.
 *
 * Words are compared exactly, so synonyms ("Engineer" and "Developer") do not
 * match. Every input is either the job as a candidate may read it or the
 * candidate's own profile, so the result can be shown to them as it is.
 *
 * Pure and synchronous — hand it both sides already resolved; it does no
 * database work.
 */

/** Job title words that describe seniority or arrangement rather than the role itself. */
const NOT_ROLE_WORDS = new Set([
  "senior",
  "lead",
  "junior",
  "head",
  "graduate",
  "intern",
  "principal",
  "trainee",
  "assistant",
  "temp",
  "temporary",
  "part",
  "time",
  "christmas",
  "weekend",
  "freelance",
  "locum",
]);

export interface RoleMatchJob {
  title?: unknown;
  category?: unknown;
}

export interface RoleMatchProfile {
  /** Names of the job titles the candidate picked. */
  jobTitles?: unknown;
  /** Names of the industries the candidate picked. */
  industries?: unknown;
  /** The candidate's free-text interests. */
  interests?: unknown;
}

export interface RoleMatchResult {
  /** 0-1, unrounded. Zero is a real result: the candidate is after a different kind of role. */
  ratio: number;
  /** False when the job's title and category give no role words to compare. */
  applicable: boolean;
}

const asText = (value: unknown): string | null => (typeof value === "string" ? value : null);
const asTexts = (value: unknown): (string | null)[] => (Array.isArray(value) ? value.map(asText) : []);

/**
 * Scores how well a job's role lines up with the roles a candidate is after.
 *
 * @param job The job's `title` and `category`.
 * @param profile The candidate's picked job titles and industries as names, and their interests.
 */
export const matchRole = (job: RoleMatchJob, profile: RoleMatchProfile): RoleMatchResult => {
  const jobWords = buildKeywords([asText(job.title), asText(job.category)]).filter((word) => !NOT_ROLE_WORDS.has(word));
  if (!jobWords.length) return { ratio: 0, applicable: false };

  const wanted = new Set(
    buildKeywords([...asTexts(profile.jobTitles), ...asTexts(profile.industries), asText(profile.interests)])
  );
  return { ratio: jobWords.filter((word) => wanted.has(word)).length / jobWords.length, applicable: true };
};

// Runnable check for the scoring rules. No database or Redis is touched.
// Run with: pnpm --filter @rl/backend exec ts-node src/v1/modules/job/match/role.ts
const demo = () => {
  const dataScientist = { jobTitles: ["Data Scientist", "Machine Learning Engineer"] };

  assert(
    matchRole({ title: "Senior Data Scientist", category: "Data & AI" }, dataScientist).ratio === 1,
    "seniority words are ignored, so the role is fully covered"
  );
  assert(
    matchRole({ title: "Customer Support Specialist", category: "Customer Support" }, dataScientist).ratio === 0,
    "an unrelated role scores 0"
  );
  assert(
    matchRole({ title: "Frontend Developer", category: "Engineering" }, { jobTitles: ["Backend Developer"] }).ratio ===
      1 / 3,
    "a related role is partly covered: developer, of frontend / developer / engineering"
  );
  assert(
    matchRole({ title: "Barista", category: "Hospitality" }, { interests: "Coffee and hospitality" }).ratio === 0.5,
    "interests count"
  );
  assert(
    matchRole({ title: "Nurse" }, { industries: ["Healthcare"], jobTitles: ["Registered Nurse"] }).ratio === 1,
    "industries and job titles both count"
  );
  assert(
    matchRole({ title: "Sales Assistant (Christmas Temp)" }, { jobTitles: ["Sales Executive"] }).ratio === 1,
    "only the role word, sales, is compared"
  );

  const nothing = matchRole({ title: "Data Analyst" }, {});
  assert(nothing.applicable && nothing.ratio === 0, "a profile with no roles scores 0");
  assert(matchRole({ title: "Data Analyst" }, { jobTitles: "Data Analyst" }).ratio === 0, "a non-array reads as none");
  assert(!matchRole({}, dataScientist).applicable, "a job with no title or category is not applicable");
  assert(!matchRole({ title: "Senior Lead" }, dataScientist).applicable, "a title of only seniority words is not");

  console.log("role match self-check ok");
};

if (require.main === module) demo();
