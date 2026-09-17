/* eslint-disable @typescript-eslint/no-explicit-any */
import Joi from "joi";
import { AbilityAction, ISession, PROFICIENCY } from "@rl/types";
import { SkillAbilityBuilder, SkillAuthZEntity, ALL_SKILL_FIELDS } from "@rl/authz";
import { BadRequestException, UnauthorizedException } from "../../../../common/helper";
import { sanitizeDocument, validateUpdatePayload } from "../../../../common/helper/authz";
import * as skillService from "../../skill/skill.service";
import { Skill } from "../../../../models";
import { AgentTool, AgentToolContext, IToolPreview } from "./tool.types";
import { assertWritableProfile, compact, isCandidate, ownershipOf } from "./profile-write.shared";

/**
 * Adds skills to the caller's own profile.
 *
 * Takes a list where the experience and education tools take one record, because
 * skills arrive in lists: "I know Python, SQL and a bit of React" is one thing
 * the user said and should be one thing they confirm. Making them approve three
 * separate cards for one sentence would train them to stop reading the cards.
 *
 * Duplicates are dropped rather than warned about, which is the opposite of what
 * `add_experience` does with a repeated employer. The difference is that two
 * rows reading "Python" are not a judgement call — nobody holds a skill twice —
 * whereas two roles at one employer often are.
 */

interface AddSkillsInput {
  skills: { name: string; proficiencyLevel?: PROFICIENCY; description?: string }[];
}

/** One confirmation should cover a sentence's worth of skills, not a CV's worth. */
const MAX_SKILLS_PER_CALL = 15;

const caslFieldOptions = {
  fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_SKILL_FIELDS,
};

const buildPayload = (skill: AddSkillsInput["skills"][number], session: ISession) => ({
  ...ownershipOf(session),
  ...compact({
    name: skill.name.trim(),
    proficiencyLevel: skill.proficiencyLevel,
    description: skill.description?.trim(),
  }),
});

const authorize = (input: AddSkillsInput, ctx: AgentToolContext) => {
  assertWritableProfile(ctx.session);

  const ability = new SkillAbilityBuilder(ctx.session).getAbility();

  if (!ability.can(AbilityAction.Create, SkillAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to add skills.");
  }

  const payloads = input.skills.map((skill) => buildPayload(skill, ctx.session));
  payloads.forEach((payload) =>
    validateUpdatePayload(payload, ability, AbilityAction.Create, new SkillAuthZEntity(payload as any))
  );

  return { ability, payloads };
};

/**
 * Splits the requested skills into those that are new and those already held.
 *
 * Case-insensitive, because "python" and "Python" are one skill to a reader and
 * two rows to Mongo. Also de-duplicates within the request itself: a model
 * summarising a rambling answer will sometimes list the same skill twice.
 */
const partition = async (input: AddSkillsInput, session: ISession) => {
  const existing = await Skill.find({
    userId: session.user._id,
    "deleteMarker.status": { $ne: true },
  })
    .select("name")
    .lean();

  const held = new Set(existing.map((skill) => String(skill.name).trim().toLowerCase()));
  const seen = new Set<string>();

  const toAdd: AddSkillsInput["skills"] = [];
  const alreadyHeld: string[] = [];

  for (const skill of input.skills) {
    const key = skill.name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    if (held.has(key)) alreadyHeld.push(skill.name.trim());
    else toAdd.push(skill);
  }

  return { toAdd, alreadyHeld };
};

const label = (skill: AddSkillsInput["skills"][number]): string =>
  skill.proficiencyLevel ? `${skill.name.trim()} (${skill.proficiencyLevel})` : skill.name.trim();

export const addSkillsTool: AgentTool<AddSkillsInput> = {
  name: "add_skills",
  description:
    "Add one or more skills to the current user's own profile. " +
    "Use this when a candidate tells you what they can do and wants it on their profile. " +
    "Pass every skill they mentioned in a single call rather than calling this repeatedly. " +
    "Nothing is saved on the first call: you get back a preview to show them, and you call this again with the " +
    "returned confirmationToken once they have agreed. " +
    "Skills they already have are skipped automatically. This cannot remove a skill — for that, tell the user to use their profile page.",

  parameters: {
    type: "object",
    properties: {
      skills: {
        type: "array",
        description: "The skills to add. Use the user's own words; do not expand an abbreviation they chose.",
        items: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The skill, e.g. 'Python', 'Patient care', 'Conversational Spanish'.",
            },
            proficiencyLevel: {
              type: "string",
              enum: Object.values(PROFICIENCY),
              description:
                "Only if the user described their level. Do not rate them yourself, and do not infer a level from how long they have worked.",
            },
            description: { type: "string", description: "Any detail they gave about the skill." },
          },
          required: ["name"],
        },
      },
    },
    required: ["skills"],
  },

  inputSchema: Joi.object({
    skills: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().trim().min(1).max(100).required().label("Skill name"),
          proficiencyLevel: Joi.string()
            .valid(...Object.values(PROFICIENCY))
            .label("Proficiency"),
          description: Joi.string().trim().max(500).label("Description"),
        })
      )
      .min(1)
      .max(MAX_SKILLS_PER_CALL)
      .required()
      .label("Skills"),
  }),

  mutating: true,

  isAvailable: isCandidate,

  async preview(input, ctx): Promise<IToolPreview> {
    authorize(input, ctx);

    const { toAdd, alreadyHeld } = await partition(input, ctx.session);

    // Thrown rather than previewed as an empty write. Asking someone to confirm
    // adding nothing is a worse interaction than being told they already have
    // these, and the model can relay the message as it stands.
    if (toAdd.length === 0) {
      throw new BadRequestException(
        `Your profile already lists ${alreadyHeld.join(", ")}, so there is nothing to add.`
      );
    }

    const names = toAdd.map(label);

    return {
      summary: names.length === 1 ? `Add the skill ${names[0]}` : `Add ${names.length} skills: ${names.join(", ")}`,
      details: { Skills: names },
      ...(alreadyHeld.length
        ? { warnings: [`Already on your profile, so these will be skipped: ${alreadyHeld.join(", ")}.`] }
        : {}),
    };
  },

  async execute(input, ctx: AgentToolContext) {
    const { ability } = authorize(input, ctx);

    // Re-partitioned rather than carried over from the preview: the two calls are
    // separate turns, and the profile may have changed in between.
    const { toAdd, alreadyHeld } = await partition(input, ctx.session);

    const created = await Promise.all(
      toAdd.map((skill) => skillService.create(buildPayload(skill, ctx.session) as never))
    );

    return {
      saved: true,
      added: created.length,
      skills: created.map((doc) =>
        sanitizeDocument<SkillAuthZEntity>(doc, ability, AbilityAction.Read, SkillAuthZEntity, caslFieldOptions)
      ),
      ...(alreadyHeld.length ? { skipped: alreadyHeld } : {}),
    };
  },
};
