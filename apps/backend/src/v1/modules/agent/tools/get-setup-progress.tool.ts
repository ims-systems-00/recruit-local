/* eslint-disable @typescript-eslint/no-explicit-any */
import Joi from "joi";
import {
  ACCOUNT_TYPE_ENUMS,
  AbilityAction,
  CANDIDATE_ONBOARDING_SEQUENCE,
  EMPLOYER_ONBOARDING_SEQUENCE,
  EMAIL_VERIFICATION_STATUS_ENUMS,
  KYC_STATUS,
  ONBOARDING_STEP_ENUMS,
  ONBOARDING_STEP_LABELS,
  PROFILE_COMPLETION_SECTIONS,
  TENANT_COMPLETION_SECTIONS,
  CompletionField,
} from "@rl/types";
import { JobProfileAbilityBuilder, JobProfileAuthZEntity, TenantAbilityBuilder, TenantAuthZEntity } from "@rl/authz";
import { expandCompletion } from "@rl/utils";
import { logger } from "../../../../common/helper";
import * as jobProfileService from "../../job-profile/job-profile.service";
import { recomputeProfileCompletion } from "../../job-profile/profile-completion.service";
import * as tenantService from "../../tenant/tenant.service";
import { recomputeTenantCompletion } from "../../tenant/tenant-completion.service";
import { AgentTool, AgentToolContext } from "./tool.types";

/**
 * "Where am I up to, and what do I do next?"
 *
 * Overlaps `get_my_profile` on purpose rather than by accident. That tool
 * returns the profile — every field, every populated catalog row — which is the
 * right answer to "what does my profile say" and a wasteful one to "what should
 * I do next": the model pays for a few thousand tokens of profile in order to
 * read one enum off it, and then has to work out the ordering itself.
 *
 * This returns a handful of fields and one ordered list, which is what makes it
 * safe to call at the top of a setup conversation and again after each step.
 *
 * Deliberately read-only. It reports the next step; it does not perform it. The
 * steps are UI flows with their own screens, and an assistant that silently
 * marked one done would leave the user with a profile field nobody filled in.
 */

/** How many outstanding profile fields to name before summarising the rest. */
const MAX_NAMED_FIELDS = 8;

interface Progress {
  currentStep: ONBOARDING_STEP_ENUMS;
  currentStepLabel: string;
  isComplete: boolean;
  completedSteps: number;
  totalSteps: number;
  nextStep: string | null;
  remainingSteps: string[];
}

/**
 * Positions the stored step within its sequence.
 *
 * `indexOf` returning -1 is treated as "at the start" rather than as an error.
 * A candidate whose stored step is `not_started` lands there, and so does one
 * carrying a step from the other audience's flow — which is reachable today,
 * since both documents share one enum. Neither is worth failing the tool over:
 * the honest answer in both cases is "begin at the first step".
 */
const progressOf = (stored: ONBOARDING_STEP_ENUMS | undefined, sequence: ONBOARDING_STEP_ENUMS[]): Progress => {
  const current = stored ?? ONBOARDING_STEP_ENUMS.NOT_STARTED;

  if (current === ONBOARDING_STEP_ENUMS.COMPLETED) {
    return {
      currentStep: current,
      currentStepLabel: ONBOARDING_STEP_LABELS[current],
      isComplete: true,
      completedSteps: sequence.length,
      totalSteps: sequence.length,
      nextStep: null,
      remainingSteps: [],
    };
  }

  // The stored step is the one most recently *finished*, so what remains starts
  // at the one after it. An unrecognised or not-yet-started value gives -1,
  // which makes the whole sequence remaining — the correct answer for both.
  const doneIndex = sequence.indexOf(current);
  const remaining = sequence.slice(doneIndex + 1);

  return {
    currentStep: current,
    currentStepLabel: ONBOARDING_STEP_LABELS[current] ?? String(current),
    isComplete: false,
    completedSteps: doneIndex + 1,
    totalSteps: sequence.length,
    nextStep: remaining.length > 0 ? ONBOARDING_STEP_LABELS[remaining[0]] : null,
    remainingSteps: remaining.map((step) => ONBOARDING_STEP_LABELS[step]),
  };
};

/**
 * Outstanding profile fields, named rather than counted.
 *
 * "Six fields missing" is not something a user can act on; "your contact number
 * and your professional summary" is. Capped because a brand-new profile is
 * missing all of them, and a list of thirty is back to being a number.
 */
const outstanding = (missingFields: CompletionField[]) => {
  const named = missingFields.slice(0, MAX_NAMED_FIELDS).map((field) => field.label);

  return {
    missingFields: named,
    ...(missingFields.length > named.length ? { andMoreCount: missingFields.length - named.length } : {}),
  };
};

/** The account-level gates, which sit outside either onboarding sequence. */
const accountStatus = (ctx: AgentToolContext) => {
  const user = ctx.session.user;

  return {
    accountType: user?.type ?? null,
    emailVerified: user?.emailVerificationStatus === EMAIL_VERIFICATION_STATUS_ENUMS.VERIFIED,
    emailVerificationStatus: user?.emailVerificationStatus ?? null,
    kycStatus: user?.kycStatus ?? KYC_STATUS.UNVERIFIED,
  };
};

const readCandidate = async (ctx: AgentToolContext) => {
  const ability = new JobProfileAbilityBuilder(ctx.session).getAbility();
  const profile: any = await jobProfileService.getOne({ query: { _id: ctx.session.jobProfileId } });

  if (!ability.can(AbilityAction.Read, new JobProfileAuthZEntity(profile))) {
    return { note: "You do not have permission to read your job profile." };
  }

  // Recomputed rather than read off the document: completion counts experience,
  // education, skill and certification rows, any of which may have changed since
  // it was last stored — including a moment ago, by the agent's own write tools.
  const stored = await recomputeProfileCompletion(profile.userId);
  const completion = expandCompletion(PROFILE_COMPLETION_SECTIONS, stored ?? profile.completion);

  return {
    onboarding: progressOf(profile.onboardingStep, CANDIDATE_ONBOARDING_SEQUENCE),
    profileCompletion: {
      percentage: completion.percentage,
      ...outstanding(completion.missingFields),
    },
  };
};

const readEmployer = async (ctx: AgentToolContext) => {
  const ability = new TenantAbilityBuilder(ctx.session).getAbility();
  const tenant: any = await tenantService.getOne({ query: { _id: ctx.session.tenantId } });

  if (!ability.can(AbilityAction.Read, new TenantAuthZEntity({ _id: tenant._id?.toString() ?? null }))) {
    return { note: "You do not have permission to read your organisation's profile." };
  }

  const stored = (await recomputeTenantCompletion(String(tenant._id))) ?? tenant.completion;
  const completion = expandCompletion(TENANT_COMPLETION_SECTIONS, stored);

  return {
    onboarding: progressOf(tenant.onboardingStep, EMPLOYER_ONBOARDING_SEQUENCE),
    organisationCompletion: {
      percentage: completion.percentage,
      ...outstanding(completion.missingFields),
    },
  };
};

export const getSetupProgressTool: AgentTool<Record<string, never>> = {
  name: "get_setup_progress",
  description:
    "Check how far the current user has got with setting up their account, and what the next step is. " +
    "Returns their account type, whether their email is verified, their identity verification status, " +
    "which onboarding step they last completed, what remains in order, and how complete their profile is. " +
    "Use this for 'how do I get started', 'what do I do next', 'am I finished', 'why can't I do X yet', " +
    "and before walking anyone through setup — it tells you where to start so you do not ask about steps they have already done. " +
    "This reports progress only; it cannot complete a step on the user's behalf.",

  parameters: { type: "object", properties: {}, required: [] },

  // No input, so no trust boundary; a stray key the model invented is not worth
  // burning a retry on.
  inputSchema: Joi.object({}).unknown(true),

  mutating: false,

  async execute(_input, ctx: AgentToolContext) {
    const account = accountStatus(ctx);

    // No account type means onboarding has not really begun: there is no job
    // profile and no tenant to read a step from, so the only true next step is
    // choosing a side. Returning early keeps the two reads below from throwing
    // NotFound on ids that were always going to be undefined.
    if (!account.accountType) {
      return {
        ...account,
        setupStarted: false,
        nextStep: "Choose whether this is a candidate account or an employer account.",
        note: "This user has not chosen an account type yet. Nothing else about their setup exists until they do, so guide them to that choice before anything else.",
      };
    }

    const isCandidate = account.accountType === ACCOUNT_TYPE_ENUMS.CANDIDATE;

    // Either id can be absent even once a type is chosen — an employer who
    // picked their role but abandoned the create-organisation screen has a type
    // and no tenant. That is a real state with a specific next step, not an error.
    if (isCandidate && !ctx.session.jobProfileId) {
      return { ...account, setupStarted: false, nextStep: "Start candidate setup to create your job profile." };
    }
    if (!isCandidate && !ctx.session.tenantId) {
      return { ...account, setupStarted: false, nextStep: "Create your organisation to continue employer setup." };
    }

    try {
      const detail = isCandidate ? await readCandidate(ctx) : await readEmployer(ctx);
      return { ...account, setupStarted: true, ...detail };
    } catch (error) {
      // Degraded rather than failed: the account-level half of the answer is
      // already in hand and is often the part that was actually asked about.
      const message = error instanceof Error ? error.message : String(error);
      logger.warn("[agent] get_setup_progress could not read onboarding detail", { error: message });

      return {
        ...account,
        setupStarted: true,
        note: `Could not read setup progress: ${message}`,
      };
    }
  },
};
