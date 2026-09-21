/* eslint-disable @typescript-eslint/no-explicit-any */
import Joi from "joi";
import { AbilityAction, ISession } from "@rl/types";
import { EducationAbilityBuilder, EducationAuthZEntity, ALL_EDUCATION_FIELDS } from "@rl/authz";
import { UnauthorizedException } from "../../../../common/helper";
import { sanitizeDocument, validateUpdatePayload } from "../../../../common/helper/authz";
import * as educationService from "../../education/education.service";
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
 * Adds one education record to the caller's own profile.
 *
 * Follows `add-experience.tool.ts` exactly — same two phases, same authorization
 * sequence, same add-only scope. Read that file for why each step is there.
 *
 * The one difference worth noting is that `fieldOfStudy` is required by the
 * schema. That is the model's own requirement, not a choice made here, and it is
 * the field a model is most tempted to fill in for someone who said only "I did
 * my A-levels at Barton". The description tells it to ask instead.
 */

interface AddEducationInput {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate?: string;
  grade?: string;
  description?: string;
}

const caslFieldOptions = {
  fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_EDUCATION_FIELDS,
};

const buildPayload = (input: AddEducationInput, session: ISession) => ({
  ...ownershipOf(session),
  ...compact({
    institution: input.institution.trim(),
    degree: input.degree.trim(),
    fieldOfStudy: input.fieldOfStudy.trim(),
    grade: input.grade?.trim(),
    description: input.description?.trim(),
  }),
  startDate: toDate(input.startDate, "Start date"),
  ...(input.endDate ? { endDate: toDate(input.endDate, "End date") } : {}),
});

const authorize = (input: AddEducationInput, ctx: AgentToolContext) => {
  assertWritableProfile(ctx.session);

  const ability = new EducationAbilityBuilder(ctx.session).getAbility();

  if (!ability.can(AbilityAction.Create, EducationAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to add education records.");
  }

  const payload = buildPayload(input, ctx.session);
  validateUpdatePayload(payload, ability, AbilityAction.Create, new EducationAuthZEntity(payload as any));

  return { ability, payload };
};

export const addEducationTool: AgentTool<AddEducationInput> = {
  name: "add_education",
  description:
    "Add one qualification to the current user's own education history. " +
    "Use this when a candidate tells you where they studied and wants it on their profile. " +
    "Nothing is saved on the first call: you get back a preview to show them, and you call this again with the " +
    "returned confirmationToken once they have agreed. " +
    "This cannot edit or delete an existing record — for that, tell the user to use their profile page.",

  parameters: {
    type: "object",
    properties: {
      institution: { type: "string", description: "The school, college or university." },
      degree: {
        type: "string",
        description: "The qualification, e.g. 'BSc', 'A-levels', 'NVQ Level 3'. Use the user's own words.",
      },
      fieldOfStudy: {
        type: "string",
        description:
          "The subject studied. Required. If the user did not say, ask them — do not infer a subject from the qualification or the institution.",
      },
      startDate: { type: "string", description: `When they started. ${DATE_FORMAT_HINT}` },
      endDate: {
        type: "string",
        description: `When they finished. ${DATE_FORMAT_HINT} Omit entirely if they are still studying.`,
      },
      grade: { type: "string", description: "The result, if they gave one, e.g. '2:1', 'Distinction'." },
      description: { type: "string", description: "Anything else they said about the course." },
    },
    required: ["institution", "degree", "fieldOfStudy", "startDate"],
  },

  inputSchema: Joi.object({
    institution: Joi.string().trim().min(1).max(200).required().label("Institution"),
    degree: Joi.string().trim().min(1).max(200).required().label("Qualification"),
    fieldOfStudy: Joi.string().trim().min(1).max(200).required().label("Field of study"),
    startDate: dateInput("Start date").required(),
    endDate: dateInput("End date"),
    grade: Joi.string().trim().max(100).label("Grade"),
    description: Joi.string().trim().max(2000).label("Description"),
  }),

  mutating: true,

  isAvailable: isCandidate,

  async preview(input, ctx): Promise<IToolPreview> {
    assertChronological(input.startDate, input.endDate, "course");
    authorize(input, ctx);

    const range = formatRange(input.startDate, input.endDate);

    return {
      summary: `Add ${input.degree} in ${input.fieldOfStudy} at ${input.institution}, ${range}`,
      details: compact({
        Institution: input.institution.trim(),
        Qualification: input.degree.trim(),
        Subject: input.fieldOfStudy.trim(),
        Dates: range,
        Grade: input.grade?.trim(),
        Description: input.description?.trim(),
      }),
    };
  },

  async execute(input, ctx: AgentToolContext) {
    assertChronological(input.startDate, input.endDate, "course");
    const { ability, payload } = authorize(input, ctx);

    const created = await educationService.create(payload as never);

    return {
      saved: true,
      education: sanitizeDocument<EducationAuthZEntity>(
        created,
        ability,
        AbilityAction.Read,
        EducationAuthZEntity,
        caslFieldOptions
      ),
    };
  },
};
