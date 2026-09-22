/* eslint-disable @typescript-eslint/no-explicit-any */
import Joi from "joi";
import { Types } from "mongoose";
import { AbilityAction, ONBOARDING_STEP_ENUMS, ONBOARDING_STEP_LABELS } from "@rl/types";
import { JobProfileAbilityBuilder, JobProfileAuthZEntity } from "@rl/authz";
import { BadRequestException, UnauthorizedException } from "../../../../common/helper";
import { validateUpdatePayload } from "../../../../common/helper/authz";
import { JobProfile } from "../../../../models";
import * as jobProfileService from "../../job-profile/job-profile.service";
import { objectIdValidation } from "../../../../common/helper/validate";
import { AgentTool, AgentToolContext, IToolPreview } from "./tool.types";
import { CATALOG_KINDS, CATALOGS, CatalogKind, loadRows, nextOnboardingStep } from "./catalog.shared";
import { assertWritableProfile, isCandidate } from "./profile-write.shared";

/**
 * Sets a candidate's job titles, industries, experience level or work modes —
 * the catalog-backed personalisation steps.
 *
 * Takes ids, never names. The ids come from `search_catalog`, the user picks
 * among the options it returned, and `preview` then loads the rows back from the
 * database by id. So the confirmation card shows the catalog's own names, and
 * because the confirmation token is signed over the ids, the rows the user
 * approved are exactly the rows written. This is what `update_my_profile` could
 * not offer, and why these fields were kept out of it.
 *
 * Replaces the selection rather than adding to it, matching the onboarding
 * screens, where the checkbox state *is* the saved value.
 */

interface SetCatalogInput {
  kind: CatalogKind;
  ids: string[];
}

interface IResolvedWrite {
  ability: ReturnType<JobProfileAbilityBuilder["getAbility"]>;
  entity: JobProfileAuthZEntity;
  payload: Record<string, unknown>;
  rows: { _id: string; name: string }[];
  currentNames: string[];
  advancesTo: ONBOARDING_STEP_ENUMS | null;
}

/** Names of whatever is stored now, so the preview can say what is being replaced. */
const currentSelection = async (kind: CatalogKind, stored: unknown): Promise<string[]> => {
  const ids = (Array.isArray(stored) ? stored : stored ? [stored] : []).map(String);
  if (ids.length === 0) return [];

  const docs = (await CATALOGS[kind].model
    .find({ _id: { $in: ids.filter((id) => Types.ObjectId.isValid(id)) } })
    .select("name")
    .lean()) as unknown as { name: string }[];

  return docs.map((doc) => doc.name);
};

/**
 * Everything both phases need, checked identically in both.
 *
 * Runs in `preview` as well as `execute` so an unwritable selection — an id that
 * is not in the catalog, too many choices — fails before the user is asked to
 * approve it, and a catalog row retired between the two turns fails at write time.
 */
const resolve = async (input: SetCatalogInput, ctx: AgentToolContext): Promise<IResolvedWrite> => {
  assertWritableProfile(ctx.session);

  const config = CATALOGS[input.kind];
  const ids = [...new Set(input.ids)];

  if (!config.multiple && ids.length !== 1) {
    throw new BadRequestException(`Choose exactly one ${config.label}. Ask the user which one applies.`);
  }
  if (ids.length > config.max) {
    throw new BadRequestException(
      `At most ${config.max} ${config.pluralLabel} can be chosen. Ask the user which ${config.max} matter most.`
    );
  }

  const { rows, missing } = await loadRows(input.kind, ids);
  if (missing.length > 0) {
    throw new BadRequestException(
      `Some choices are not in the ${config.label} list. Use search_catalog and only pass ids it returned.`
    );
  }

  const ability = new JobProfileAbilityBuilder(ctx.session).getAbility();
  const entity = new JobProfileAuthZEntity({ _id: ctx.session.jobProfileId } as any);

  if (!ability.can(AbilityAction.Read, entity) || !ability.can(AbilityAction.Update, entity)) {
    throw new UnauthorizedException("You are not authorized to update this profile.");
  }

  const profile = (await JobProfile.findById(ctx.session.jobProfileId)
    .select(`${config.profileField} onboardingStep`)
    .lean()) as any;

  const advancesTo = nextOnboardingStep(profile?.onboardingStep, config.step);
  const objectIds = rows.map((row) => new Types.ObjectId(row._id));

  const payload: Record<string, unknown> = {
    [config.profileField]: config.multiple ? objectIds : objectIds[0],
    ...(advancesTo ? { onboardingStep: advancesTo } : {}),
  };

  validateUpdatePayload(payload, ability, AbilityAction.Update, entity);

  return {
    ability,
    entity,
    payload,
    rows,
    currentNames: await currentSelection(input.kind, profile?.[config.profileField]),
    advancesTo,
  };
};

export const setProfileCatalogTool: AgentTool<SetCatalogInput> = {
  name: "set_profile_catalog",
  description:
    "Set the current candidate's job titles, industries, experience level or work modes — the choices from the " +
    "personalisation part of setup. Only call this when the user asked for their selection to change — they picked " +
    "options, or asked you to set or choose some for them. A request to find, suggest or recommend options is " +
    "answered from search_catalog alone. Pass ids returned by search_catalog; this " +
    "replaces their current selection for that list. Job titles, industries and work modes allow up to 3; experience " +
    "level takes exactly one. " +
    "Nothing is saved on the first call: you get back a preview to show them, and you call this again with the " +
    "returned confirmationToken once they have agreed. After it is saved, tell them they can continue to the next step " +
    "on the page.",

  parameters: {
    type: "object",
    properties: {
      kind: { type: "string", enum: [...CATALOG_KINDS], description: "Which list to set." },
      ids: {
        type: "array",
        items: { type: "string" },
        description:
          "Ids from search_catalog. Only options the user chose, or picked by you because they asked you to select some for them.",
      },
    },
    required: ["kind", "ids"],
  },

  inputSchema: Joi.object({
    kind: Joi.string()
      .valid(...CATALOG_KINDS)
      .required(),
    ids: Joi.array().items(Joi.string().custom(objectIdValidation)).min(1).max(3).required().label("Choices"),
  }),

  mutating: true,

  isAvailable: isCandidate,

  async preview(input, ctx): Promise<IToolPreview> {
    const { rows, currentNames, advancesTo } = await resolve(input, ctx);
    const config = CATALOGS[input.kind];
    const names = rows.map((row) => row.name);

    const warnings: string[] = [];
    if (currentNames.length > 0) {
      warnings.push(`This replaces your current ${config.pluralLabel}: ${currentNames.join(", ")}.`);
    }

    return {
      summary: `Set your ${names.length === 1 ? config.label : config.pluralLabel} to ${names.join(", ")}`,
      details: {
        [names.length === 1 ? capitalise(config.label) : capitalise(config.pluralLabel)]: names,
        ...(advancesTo ? { "Setup step": `${ONBOARDING_STEP_LABELS[advancesTo]} — marked done` } : {}),
      },
      ...(warnings.length ? { warnings } : {}),
    };
  },

  async execute(input, ctx: AgentToolContext) {
    const { payload, rows, advancesTo } = await resolve(input, ctx);

    await jobProfileService.update({
      query: { _id: ctx.session.jobProfileId },
      payload: payload as never,
    } as never);

    return {
      saved: true,
      kind: input.kind,
      selected: rows.map((row) => row.name),
      ...(advancesTo ? { onboardingStepCompleted: ONBOARDING_STEP_LABELS[advancesTo] } : {}),
      note: "Saved. If the user is on the setup page, their selections now show there and they can press Next to continue.",
    };
  },
};

const capitalise = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);
