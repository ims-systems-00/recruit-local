/* eslint-disable @typescript-eslint/no-explicit-any */
import Joi from "joi";
import { AbilityAction, EMPLOYMENT_TYPE, ISession, WORKPLACE_ENUMS } from "@rl/types";
import { ExperienceAbilityBuilder, ExperienceAuthZEntity, ALL_EXPERIENCE_FIELDS } from "@rl/authz";
import { UnauthorizedException } from "../../../../common/helper";
import { sanitizeDocument, validateUpdatePayload } from "../../../../common/helper/authz";
import * as experienceService from "../../experience/experience.service";
import { Experience } from "../../../../models";
import { AgentTool, AgentToolContext, IToolPreview } from "./tool.types";
import {
  DATE_FORMAT_HINT,
  assertChronological,
  assertWritableProfile,
  compact,
  dateInput,
  formatRange,
  isCandidate,
  ownershipOf,
  toDate,
} from "./profile-write.shared";

/**
 * Adds one work-experience record to the caller's own profile.
 *
 * The first mutating tool in the module, and the pattern the others follow: it
 * is a controller without HTTP, exactly as `tool.types.ts` requires, and it is
 * additionally gated by the confirmation flow in `confirmation.ts` — `preview`
 * runs first, the user agrees, and only then does `execute` run.
 *
 * Add, never edit or delete. Correcting a record means knowing which one is
 * meant, and "no, the other nursing job" is a disambiguation problem this tool
 * would have to solve by guessing between two rows. Editing and deleting stay
 * on the profile screens, where the user points at the row themselves.
 */

interface AddExperienceInput {
  jobTitle: string;
  company: string;
  startDate: string;
  endDate?: string;
  location?: string;
  workplace?: WORKPLACE_ENUMS;
  employmentType?: EMPLOYMENT_TYPE;
  description?: string;
}

const caslFieldOptions = {
  fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_EXPERIENCE_FIELDS,
};

/**
 * The document as it will be stored.
 *
 * Shared by `preview` and `execute` so the values shown and the values written
 * are produced by one function rather than two that agree today. The
 * confirmation token is signed over the tool's arguments, which makes that
 * agreement the only remaining way the two could diverge.
 */
const buildPayload = (input: AddExperienceInput, session: ISession) => ({
  ...ownershipOf(session),
  ...compact({
    jobTitle: input.jobTitle.trim(),
    company: input.company.trim(),
    location: input.location?.trim(),
    workplace: input.workplace,
    employmentType: input.employmentType,
    description: input.description?.trim(),
  }),
  startDate: toDate(input.startDate, "Start date"),
  ...(input.endDate ? { endDate: toDate(input.endDate, "End date") } : {}),
  // Derived, not asked for: "is this your current job" is already answered by
  // whether an end date was given, and offering the model a separate boolean
  // invites it to set one that contradicts the dates.
  isActive: !input.endDate,
});

/**
 * Everything both phases must check.
 *
 * Run from `preview` as well as `execute` rather than only at write time: a user
 * should not be asked to approve a record that was never going to be accepted,
 * and an authorization failure is more useful before the question than after it.
 */
const authorize = (input: AddExperienceInput, ctx: AgentToolContext) => {
  assertWritableProfile(ctx.session);

  const ability = new ExperienceAbilityBuilder(ctx.session).getAbility();

  if (!ability.can(AbilityAction.Create, ExperienceAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to add work experience.");
  }

  const payload = buildPayload(input, ctx.session);

  // Field-level check, not just action-level: the Create rule lists the fields a
  // candidate may set, and `userId` is not among them. Passing the payload
  // through the same helper the REST controller uses keeps the two honest.
  validateUpdatePayload(payload, ability, AbilityAction.Create, new ExperienceAuthZEntity(payload as any));

  return { ability, payload };
};

/**
 * Flags an existing record that looks like the same job.
 *
 * A warning rather than a refusal. Someone genuinely can hold the same title at
 * the same employer twice — a contract that was renewed, a return after a break —
 * and refusing would leave them unable to record a real job. Telling them what
 * already exists lets them decide, which is what the confirmation step is for.
 */
const duplicateWarning = async (input: AddExperienceInput, session: ISession): Promise<string[]> => {
  const existing = await Experience.findOne({
    userId: session.user._id,
    "deleteMarker.status": { $ne: true },
    // Anchored and case-insensitive so "st mary's" matches "St Mary's", but
    // "St Mary's Trust" does not — a longer name is usually a different employer.
    company: new RegExp(`^${input.company.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
  }).lean();

  if (!existing) return [];

  return [
    `Your profile already has a role at ${existing.company} (${existing.jobTitle}). Check this is a different one before saving.`,
  ];
};

export const addExperienceTool: AgentTool<AddExperienceInput> = {
  name: "add_experience",
  description:
    "Add one job to the current user's own work experience. " +
    "Use this when a candidate tells you about a role they have held and wants it on their profile. " +
    "Nothing is saved on the first call: you get back a preview to show them, and you call this again with the " +
    "returned confirmationToken once they have agreed. " +
    "Add one role per call. This cannot edit or delete an existing record — for that, tell the user to use their profile page.",

  parameters: {
    type: "object",
    properties: {
      jobTitle: { type: "string", description: "The role held, e.g. 'Staff Nurse'. Use the user's own words." },
      company: { type: "string", description: "The employer's name." },
      startDate: { type: "string", description: `When they started. ${DATE_FORMAT_HINT}` },
      endDate: {
        type: "string",
        description: `When they left. ${DATE_FORMAT_HINT} Omit entirely if this is their current job — do not guess today's date.`,
      },
      location: { type: "string", description: "Where the role was based, e.g. 'Manchester'." },
      workplace: {
        type: "string",
        enum: Object.values(WORKPLACE_ENUMS),
        description: "Only if the user said. Do not infer it from the job title.",
      },
      employmentType: {
        type: "string",
        enum: Object.values(EMPLOYMENT_TYPE),
        description: "Only if the user said. Do not assume full-time.",
      },
      description: { type: "string", description: "What they did in the role, if they described it." },
    },
    required: ["jobTitle", "company", "startDate"],
  },

  // Strict, unlike the read tools: this decides what gets written to someone's
  // profile, so an unrecognised key is a mistake worth surfacing rather than
  // ignoring.
  inputSchema: Joi.object({
    jobTitle: Joi.string().trim().min(1).max(200).required().label("Job title"),
    company: Joi.string().trim().min(1).max(200).required().label("Company"),
    startDate: dateInput("Start date").required(),
    endDate: dateInput("End date"),
    location: Joi.string().trim().max(200).label("Location"),
    workplace: Joi.string()
      .valid(...Object.values(WORKPLACE_ENUMS))
      .label("Workplace"),
    employmentType: Joi.string()
      .valid(...Object.values(EMPLOYMENT_TYPE))
      .label("Employment type"),
    description: Joi.string().trim().max(2000).label("Description"),
  }),

  mutating: true,

  isAvailable: isCandidate,

  async preview(input, ctx): Promise<IToolPreview> {
    assertChronological(input.startDate, input.endDate, "role");
    authorize(input, ctx);

    const range = formatRange(input.startDate, input.endDate);
    const warnings = await duplicateWarning(input, ctx.session);

    // Only fields the user actually supplied are listed. Padding the card with
    // "Employment type: not set" asks them to confirm an absence, which is how a
    // preview stops being read.
    return {
      summary: `Add ${input.jobTitle} at ${input.company}, ${range}`,
      details: compact({
        "Job title": input.jobTitle.trim(),
        Company: input.company.trim(),
        Dates: range,
        Location: input.location?.trim(),
        "Work mode": input.workplace,
        "Employment type": input.employmentType,
        Description: input.description?.trim(),
      }),
      ...(warnings.length ? { warnings } : {}),
    };
  },

  async execute(input, ctx: AgentToolContext) {
    assertChronological(input.startDate, input.endDate, "role");
    const { ability, payload } = authorize(input, ctx);

    const created = await experienceService.create(payload as never);

    return {
      saved: true,
      experience: sanitizeDocument<ExperienceAuthZEntity>(
        created,
        ability,
        AbilityAction.Read,
        ExperienceAuthZEntity,
        caslFieldOptions
      ),
    };
  },
};
