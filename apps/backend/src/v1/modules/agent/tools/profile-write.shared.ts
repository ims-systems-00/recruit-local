import Joi from "joi";
import { ACCOUNT_TYPE_ENUMS, ISession } from "@rl/types";
import { BadRequestException } from "../../../../common/helper";

/**
 * Shared machinery for the tools that write to a candidate's profile.
 *
 * These are the only tools in the module that change anything, and they share
 * three concerns: who may reach them, how a date typed in conversation becomes a
 * `Date`, and how the values are read back to the user for approval. Keeping all
 * three here means a new write tool inherits the same answers rather than
 * inventing its own — which matters most for dates, where the parsing rule *is*
 * the safety property.
 */

/**
 * Write tools are offered to candidates only.
 *
 * A prompt-economy filter, not the boundary: CASL grants the underlying Create
 * rules to candidates alone, so an employer reaching one of these would be
 * refused by the ability check anyway. This keeps four tools the model could
 * never successfully call out of an employer's context window.
 */
export const isCandidate = (session: ISession): boolean => session.user?.type === ACCOUNT_TYPE_ENUMS.CANDIDATE;

/**
 * A date as the model is allowed to send it: `YYYY-MM` or `YYYY-MM-DD`.
 *
 * Free text is deliberately not accepted. People say "about three years ago" and
 * "the summer before last", and a model asked to turn that into a date will
 * produce one — confidently, and often wrongly. Requiring a resolved date pushes
 * the ambiguity back to where it can be settled, which is the model asking the
 * user which year they meant.
 */
export const dateInput = (label: string) =>
  Joi.string()
    .trim()
    .pattern(/^\d{4}-\d{2}(-\d{2})?$/)
    .message(`${label} must be written as YYYY-MM or YYYY-MM-DD. Ask the user for the month and year if unsure.`)
    .label(label);

/** The same rule, written for the model rather than for the validator. */
export const DATE_FORMAT_HINT =
  "Format as YYYY-MM or YYYY-MM-DD. If the user was vague about when, ask them for the month and year rather than estimating one.";

/**
 * Turns an accepted date string into a `Date`.
 *
 * Anchored at midday UTC rather than midnight. A date stored as `2019-03-01T00:00:00Z`
 * renders as 28 February to anyone west of Greenwich, and a start date that moves
 * a day — and sometimes a month — when the user reloads their profile reads as a
 * bug in their record. Midday is far enough from both boundaries that no real
 * timezone crosses it.
 *
 * A month-only value becomes the first of that month, which is the convention
 * every CV uses.
 */
export const toDate = (value: string, label: string): Date => {
  const normalised = value.length === 7 ? `${value}-01` : value;
  const parsed = new Date(`${normalised}T12:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`${label} is not a real date. Check the month and day with the user.`);
  }

  return parsed;
};

/**
 * How a date is shown back to the user in a preview.
 *
 * Long month names, never numeric: `03/04/2019` is March in one country and
 * April in another, and a preview whose whole job is to be checked must not be
 * the ambiguous rendering. A month-only input is echoed as a month, so the user
 * is not asked to confirm a day they never gave.
 */
export const formatDate = (value: string): string => {
  const date = toDate(value, "Date");
  const monthOnly = value.length === 7;

  return date.toLocaleDateString("en-GB", {
    ...(monthOnly ? {} : { day: "numeric" }),
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
};

/** "March 2019 – present" / "March 2019 – June 2022". */
export const formatRange = (start: string, end?: string): string =>
  `${formatDate(start)} – ${end ? formatDate(end) : "present"}`;

/**
 * Rejects a range that runs backwards.
 *
 * Checked before the preview rather than at write time, because the preview is
 * the thing the user is being asked to approve: a nonsensical range should be
 * corrected while it is still a proposal.
 */
export const assertChronological = (start: string, end: string | undefined, label: string): void => {
  if (!end) return;
  if (toDate(end, "End date").getTime() >= toDate(start, "Start date").getTime()) return;

  throw new BadRequestException(`That ${label} ends before it starts. Check the dates with the user.`);
};

/**
 * The owner fields stamped on every record these tools create.
 *
 * Taken from the session and never from the model's arguments. `userId` is what
 * profile completion counts by; `jobProfileId` is what the CASL Read and Update
 * rules are conditioned on, so a record created without it is one the user
 * cannot subsequently see or edit — the failure would surface much later, as a
 * profile entry that exists but never appears.
 */
export const ownershipOf = (session: ISession) => ({
  userId: session.user._id,
  jobProfileId: session.jobProfileId,
});

/**
 * Guards the precondition every write tool shares.
 *
 * A candidate mid-onboarding can have no job profile yet. Without this the
 * records would be created unowned, per the note above.
 */
export const assertWritableProfile = (session: ISession): void => {
  if (!session.jobProfileId) {
    throw new BadRequestException(
      "This account has no candidate profile yet, so nothing can be added to it. Tell the user to finish setting up their profile first."
    );
  }
};

/** Drops keys whose value is undefined, so an absent field is absent rather than null. */
export const compact = <T extends Record<string, unknown>>(value: T): Partial<T> =>
  Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined && v !== "")) as Partial<T>;
