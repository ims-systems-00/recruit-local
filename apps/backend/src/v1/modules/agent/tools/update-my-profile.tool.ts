/* eslint-disable @typescript-eslint/no-explicit-any */
import Joi from "joi";
import { AbilityAction } from "@rl/types";
import { JobProfileAbilityBuilder, JobProfileAuthZEntity, ALL_JOB_PROFILE_FIELDS } from "@rl/authz";
import { BadRequestException, UnauthorizedException } from "../../../../common/helper";
import { sanitizeDocument, validateUpdatePayload } from "../../../../common/helper/authz";
import * as jobProfileService from "../../job-profile/job-profile.service";
import { AgentTool, AgentToolContext, IToolPreview } from "./tool.types";
import { assertWritableProfile, compact, isCandidate } from "./profile-write.shared";

/**
 * Updates the free-text details on the caller's own candidate profile.
 *
 * The writable set is deliberately much narrower than what CASL would allow.
 * `CANDIDATE_MUTATION_FIELDS` also covers `jobTitle`, `industry`, `workMode`,
 * `experienceLevel` and `values`, and every one of those is an ObjectId
 * reference into a catalog collection. For the model to set one it would have to
 * pick an id — which means either inventing one, or a lookup step where a
 * near-miss ("Nurse" vs "Nurse Practitioner") is silently wrong and invisible in
 * the preview, since the preview would show the name the model searched for
 * rather than the row it matched. Those stay on the onboarding screens, which
 * offer the real list.
 *
 * Three more are excluded for their own reasons. `visibility` decides whether
 * employers can see the profile at all, which is not a thing to change as a side
 * effect of a chat. `onboardingStep` is progress, and marking a step complete
 * that nobody completed is exactly the lie the whole confirmation design exists
 * to prevent. `email` is an identity field and belongs with account settings.
 *
 * What is left is prose the user dictates and can check in a preview, which is
 * the class of field this tool is actually good at.
 */

interface UpdateProfileInput {
  summary?: string;
  contactNumber?: string;
  address?: string;
  portfolioUrl?: string;
  name?: string;
}

/** Field name to the label shown in the preview and stored on the document. */
const FIELDS: { key: keyof UpdateProfileInput; label: string }[] = [
  { key: "name", label: "Display name" },
  { key: "summary", label: "Professional summary" },
  { key: "contactNumber", label: "Contact number" },
  { key: "address", label: "Address" },
  { key: "portfolioUrl", label: "Portfolio URL" },
];

const caslFieldOptions = {
  fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_JOB_PROFILE_FIELDS,
};

const buildPayload = (input: UpdateProfileInput) =>
  compact({
    name: input.name?.trim(),
    summary: input.summary?.trim(),
    contactNumber: input.contactNumber?.trim(),
    address: input.address?.trim(),
    portfolioUrl: input.portfolioUrl?.trim(),
  });

const authorize = (input: UpdateProfileInput, ctx: AgentToolContext) => {
  assertWritableProfile(ctx.session);

  const payload = buildPayload(input);
  if (Object.keys(payload).length === 0) {
    throw new BadRequestException("No profile details were given to update. Ask the user what they want to change.");
  }

  const ability = new JobProfileAbilityBuilder(ctx.session).getAbility();
  const entity = new JobProfileAuthZEntity({ _id: ctx.session.jobProfileId } as any);

  if (!ability.can(AbilityAction.Update, entity)) {
    throw new UnauthorizedException("You are not authorized to update this profile.");
  }

  validateUpdatePayload(payload, ability, AbilityAction.Update, entity);

  return { ability, payload };
};

export const updateMyProfileTool: AgentTool<UpdateProfileInput> = {
  name: "update_my_profile",
  description:
    "Update the written details on the current user's own candidate profile: their professional summary, " +
    "contact number, address, portfolio link, or the name shown on the profile. " +
    "Send only the fields the user actually asked to change — anything you omit is left alone. " +
    "Nothing is saved on the first call: you get back a preview to show them, and you call this again with the " +
    "returned confirmationToken once they have agreed. " +
    "This cannot change job titles, industries, work mode or experience level — use search_catalog and " +
    "set_profile_catalog for those. It cannot change values either; direct the user to their profile page for that.",

  parameters: {
    type: "object",
    properties: {
      summary: {
        type: "string",
        description:
          "A short professional summary. If you drafted this rather than quoting the user, say so when you show them the preview.",
      },
      contactNumber: { type: "string", description: "Their contact phone number, exactly as they gave it." },
      address: { type: "string", description: "Their address, as they gave it." },
      portfolioUrl: { type: "string", description: "A link to their portfolio or personal site. Must be a full URL." },
      name: {
        type: "string",
        description: "The name shown on their profile, if it should differ from their account name.",
      },
    },
    required: [],
  },

  inputSchema: Joi.object({
    summary: Joi.string().trim().max(3000).label("Summary"),
    contactNumber: Joi.string().trim().max(50).label("Contact number"),
    address: Joi.string().trim().max(300).label("Address"),
    // Scheme-restricted rather than a bare `uri()`: Joi would otherwise accept
    // `javascript:` and `data:`, and this string is rendered as a link on a
    // profile other people open.
    portfolioUrl: Joi.string()
      .trim()
      .uri({ scheme: ["http", "https"] })
      .max(500)
      .label("Portfolio URL"),
    name: Joi.string().trim().max(200).label("Name"),
  })
    .min(1)
    .messages({ "object.min": "Nothing was given to update." }),

  mutating: true,

  isAvailable: isCandidate,

  async preview(input, ctx): Promise<IToolPreview> {
    const { payload } = authorize(input, ctx);

    const changed = FIELDS.filter((field) => payload[field.key] !== undefined);

    // Values shown in full, never truncated. A summary is the field most likely
    // to have been drafted by the model rather than dictated, so it is the one
    // the user most needs to read before agreeing to it.
    const details = Object.fromEntries(changed.map((field) => [field.label, payload[field.key]]));

    return {
      summary:
        changed.length === 1
          ? `Update your ${changed[0].label.toLowerCase()}`
          : `Update ${changed.length} details on your profile`,
      details,
      warnings: ["This replaces what is currently on your profile for these fields."],
    };
  },

  async execute(input, ctx: AgentToolContext) {
    const { ability, payload } = authorize(input, ctx);

    const updated = await jobProfileService.update({
      query: { _id: ctx.session.jobProfileId },
      payload: payload as never,
    } as never);

    return {
      saved: true,
      updatedFields: Object.keys(payload),
      profile: sanitizeDocument<JobProfileAuthZEntity>(
        updated,
        ability,
        AbilityAction.Read,
        JobProfileAuthZEntity,
        caslFieldOptions
      ),
    };
  },
};
