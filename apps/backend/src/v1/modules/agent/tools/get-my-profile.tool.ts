/* eslint-disable @typescript-eslint/no-explicit-any */
import Joi from "joi";
import { AbilityAction, PROFILE_COMPLETION_SECTIONS } from "@rl/types";
import {
  UserAbilityBuilder,
  UserAuthZEntity,
  ALL_USER_FIELDS,
  TenantAbilityBuilder,
  TenantAuthZEntity,
  ALL_TENANT_FIELDS,
  JobProfileAbilityBuilder,
  JobProfileAuthZEntity,
  ALL_JOB_PROFILE_FIELDS,
} from "@rl/authz";
import { expandCompletion } from "@rl/utils";
import { logger, NotFoundException } from "../../../../common/helper";
import { sanitizeDocument } from "../../../../common/helper/authz";
import * as userService from "../../user/user.service";
import { toUserResponse } from "../../user/user.dto";
import * as tenantService from "../../tenant/tenant.service";
import { toTenantResponse } from "../../tenant/tenant.dto";
import { recomputeTenantCompletion } from "../../tenant/tenant-completion.service";
import * as jobProfileService from "../../job-profile/job-profile.service";
import { recomputeProfileCompletion } from "../../job-profile/profile-completion.service";
import { toNamedRefResponse, toNamedRefResponseList } from "../../job-profile/job-profile.dto";
import { toValueResponseList } from "../../value/value.dto";
import { AgentTool, AgentToolContext } from "./tool.types";

const userFieldOptions = {
  fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_USER_FIELDS,
};
const tenantFieldOptions = {
  fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_TENANT_FIELDS,
};
const jobProfileFieldOptions = {
  fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_JOB_PROFILE_FIELDS,
};

/**
 * Populated FileMedia objects carry S3 bucket keys and visibility bookkeeping —
 * pure token cost for a model answering questions about a profile. Whether a
 * photo exists is already reported by the `photo` section of the completion
 * breakdown, which is the form that question actually takes.
 */
const dropMediaObjects = (doc: any) => {
  if (!doc) return doc;
  delete doc.profileImage;
  delete doc.coverPhoto;
  delete doc.profileImageId;
  delete doc.coverPhotoId;
  delete doc.logoSquareStorage;
  delete doc.logoRectangleStorage;
  return doc;
};

/**
 * Mirrors `finalizeJobProfile` in job-profile.controller.ts: turns populated
 * catalog documents into `{ name }` shapes so the model reads role and industry
 * names rather than trying to pronounce ObjectIds.
 */
const finalizeJobProfile = (doc: any) => {
  if (!doc) return doc;

  if (Array.isArray(doc.values)) doc.values = toValueResponseList(doc.values);
  if (Array.isArray(doc.jobTitle)) doc.jobTitle = toNamedRefResponseList(doc.jobTitle);
  if (Array.isArray(doc.industry)) doc.industry = toNamedRefResponseList(doc.industry);
  if (Array.isArray(doc.workMode)) doc.workMode = toNamedRefResponseList(doc.workMode);
  if (doc.experienceLevel && typeof doc.experienceLevel === "object") {
    doc.experienceLevel = toNamedRefResponse(doc.experienceLevel);
  }

  // Expand only if `completion` survived sanitization — it is stripped for
  // anyone reading a profile that is not their own.
  if (doc.completion) {
    doc.completion = expandCompletion(PROFILE_COMPLETION_SECTIONS, doc.completion);
  }

  return dropMediaObjects(doc);
};

/**
 * Runs one section, converting a failure into a note instead of a rejection.
 *
 * Every `getOne` in this codebase throws NotFoundException rather than returning
 * null, so without this a single missing record would take the whole tool down
 * and the user would get an error where a partial profile would have answered
 * their question.
 */
const safeSection = async <T>(label: string, notes: string[], read: () => Promise<T | null>): Promise<T | null> => {
  try {
    return await read();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(`[agent] get_my_profile could not read ${label}`, { error: message });
    notes.push(`Could not load ${label}: ${message}`);
    return null;
  }
};

/**
 * The caller's own user account. Always attempted.
 *
 * The raw aggregation from `userService.getOne` contains the bcrypt password
 * hash and soft-delete markers, so sanitizing is mandatory, not hygiene.
 * `toUserResponse` strips the same fields independently — worth the redundancy
 * on the one payload that would be genuinely damaging to hand to a model.
 */
const readAccount = async (ctx: AgentToolContext, notes: string[]) => {
  const ability = new UserAbilityBuilder(ctx.session).getAbility();
  const raw = await userService.getOne({ query: { _id: ctx.session.user._id } });

  if (!ability.can(AbilityAction.Read, new UserAuthZEntity(raw))) {
    // A user part-way through onboarding has `type === null` and no Read rule
    // at all, not even on themselves.
    notes.push(
      "Account details are unavailable because this account's type has not been set yet. Finishing onboarding will resolve it."
    );
    return null;
  }

  const account: Record<string, any> = toUserResponse(
    sanitizeDocument(raw, ability, AbilityAction.Read, UserAuthZEntity, userFieldOptions)
  );

  // `fullName` is a Mongoose virtual, so it never appears in aggregation output
  // even though every read field-set lists it.
  if (!account.fullName && ctx.session.user.fullName) account.fullName = ctx.session.user.fullName;

  return account;
};

/**
 * The caller's organisation. Present only for accounts that belong to one.
 *
 * Note the explicit `_id` filter: `tenantRoleScopedSecurityQuery` is useless
 * here because the public-read rule is unconditioned, so `accessibleBy` matches
 * every tenant on the platform. The scoping has to come from the session.
 */
const readOrganisation = async (ctx: AgentToolContext, notes: string[]) => {
  if (!ctx.session.tenantId) return null;

  const ability = new TenantAbilityBuilder(ctx.session).getAbility();
  const tenant: any = await tenantService.getOne({ query: { _id: ctx.session.tenantId } });

  if (!ability.can(AbilityAction.Read, new TenantAuthZEntity({ _id: tenant._id?.toString() ?? null }))) {
    notes.push("You do not have permission to read your organisation's profile.");
    return null;
  }

  // Self-heal for organisations that predate the completion feature, as
  // tenant.controller.get does on read.
  if (!tenant.completion?.computedAt) {
    const completion = await recomputeTenantCompletion(String(tenant._id));
    if (completion) tenant.completion = completion;
  }

  // toTenantResponse expands `completion` into { percentage, sections, missing }.
  return dropMediaObjects(
    toTenantResponse(sanitizeDocument(tenant, ability, AbilityAction.Read, TenantAuthZEntity, tenantFieldOptions))
  );
};

/**
 * The caller's candidate profile. Present only for accounts that have one.
 *
 * CASL does the ownership work for free: a candidate's Read rule is conditioned
 * on `{ _id: session.jobProfileId }`, so a mismatched id fails the row check.
 */
const readJobProfile = async (ctx: AgentToolContext, notes: string[]) => {
  if (!ctx.session.jobProfileId) return null;

  const ability = new JobProfileAbilityBuilder(ctx.session).getAbility();
  const profile: any = await jobProfileService.getOne({ query: { _id: ctx.session.jobProfileId } });

  if (!ability.can(AbilityAction.Read, new JobProfileAuthZEntity(profile))) {
    notes.push("You do not have permission to read your job profile.");
    return null;
  }

  // Recompute rather than trust the stored value: completion counts experience,
  // education, skill and certification rows, any of which may have changed since
  // it was last written. Keyed by userId, not jobProfileId.
  const stored = await recomputeProfileCompletion(profile.userId);
  if (stored) profile.completion = stored;

  return finalizeJobProfile(
    sanitizeDocument(profile, ability, AbilityAction.Read, JobProfileAuthZEntity, jobProfileFieldOptions)
  );
};

/**
 * Reads the caller's own profile, composed from whichever records the session
 * points at.
 *
 * The composition is driven by `session.tenantId` / `session.jobProfileId`, not
 * by `session.user.type` — an employer has the former, a candidate the latter,
 * and each section is independently CASL-gated on top. That keeps the tool
 * inside the contract in tool.types.ts while still serving both audiences.
 */
export const getMyProfileTool: AgentTool<Record<string, never>> = {
  name: "get_my_profile",
  description:
    "Get the current user's own profile. Returns their user account, plus their organisation's profile if they belong to one, " +
    "or their candidate job profile if they have one. Organisation and job profile each include a completion breakdown with a " +
    "percentage and a `missing` list naming the sections that are still incomplete. " +
    "Use this for any question about the user's own account, organisation, or profile — including how complete it is, what is " +
    "missing, what they should fill in next, or which roles and industries they are set up for. " +
    "This only ever returns the caller's own data; it cannot look up anyone else.",

  parameters: {
    type: "object",
    properties: {},
    required: [],
  },

  // Deliberately lenient. The tool takes no input, so there is no trust boundary
  // to defend, and rejecting a stray key the model invented would burn a retry
  // to no purpose.
  inputSchema: Joi.object({}).unknown(true),

  mutating: false,

  async execute(_input, ctx: AgentToolContext) {
    const notes: string[] = [];

    const [account, organisation, jobProfile] = await Promise.all([
      safeSection("your account", notes, () => readAccount(ctx, notes)),
      safeSection("your organisation profile", notes, () => readOrganisation(ctx, notes)),
      safeSection("your job profile", notes, () => readJobProfile(ctx, notes)),
    ]);

    if (!account && !organisation && !jobProfile) {
      logger.warn("[agent] get_my_profile resolved nothing", { userId: ctx.session.user?._id, notes });
      throw new NotFoundException(notes[0] ?? "No profile information is available for this account.");
    }

    return {
      ...(account ? { account } : {}),
      ...(organisation ? { organisation } : {}),
      ...(jobProfile ? { jobProfile } : {}),
      notes,
    };
  },
};
