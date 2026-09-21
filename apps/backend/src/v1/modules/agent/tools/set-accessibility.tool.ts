/* eslint-disable @typescript-eslint/no-explicit-any */
import Joi from "joi";
import {
  AbilityAction,
  ANSWER_LENGTH,
  AccessibilityPreferences,
  DEFAULT_ACCESSIBILITY_PREFERENCES,
  SPEECH_RATE_MAX,
  SPEECH_RATE_MIN,
} from "@rl/types";
import { UserAbilityBuilder, UserAuthZEntity } from "@rl/authz";
import { BadRequestException, UnauthorizedException } from "../../../../common/helper";
import { validateUpdatePayload } from "../../../../common/helper/authz";
import { User } from "../../../../models";
import { AgentTool, AgentToolContext } from "./tool.types";
import { compact } from "./profile-write.shared";

/**
 * Records how this user wants to be communicated with.
 *
 * Writes immediately rather than going through the confirmation gate — the one
 * tool that does. The justification is spelled out on `requiresConfirmation` in
 * `tool.types.ts`, and it is specifically an accessibility argument: a user who
 * has just asked for one question at a time should not have to answer a
 * confirmation prompt in order to get it. The change affects nobody else, it is
 * audible in the very next sentence, and "go back to normal" undoes it.
 *
 * The preferences take effect on the *next* turn, because the system prompt for
 * this one was built before the tool ran. That is worth the model knowing, hence
 * the note in the result: otherwise it apologises for a long answer it has
 * already started writing.
 */

interface SetAccessibilityInput {
  plainLanguage?: boolean;
  answerLength?: ANSWER_LENGTH;
  oneQuestionAtATime?: boolean;
  autoReadAloud?: boolean;
  voice?: string;
  speechRate?: number;
}

/** Human wording for each setting, so the model can confirm what it changed. */
const describe = (key: keyof SetAccessibilityInput, value: unknown): string => {
  switch (key) {
    case "plainLanguage":
      return value ? "plain language on" : "plain language off";
    case "answerLength":
      return `answers set to ${value}`;
    case "oneQuestionAtATime":
      return value ? "one question at a time" : "several questions at once is fine";
    case "autoReadAloud":
      return value ? "read answers aloud automatically" : "no automatic read-aloud";
    case "voice":
      return `read-aloud voice set to ${value}`;
    case "speechRate":
      return `read-aloud speed set to ${value}×`;
    default:
      return String(key);
  }
};

export const setAccessibilityTool: AgentTool<SetAccessibilityInput> = {
  name: "set_accessibility_preferences",
  description:
    "Record how this user wants you to communicate with them, so it persists into their next conversation. " +
    "Use this whenever someone asks you to change how you write or speak to them — 'keep it simple', 'plain English', " +
    "'shorter answers', 'one thing at a time', 'read that out', 'slow down', 'stop reading aloud' — and also when they " +
    "mention a need it would serve, such as finding forms hard or using a screen reader. " +
    "Set only what they asked for; anything you omit stays as it is. " +
    "This saves immediately, so confirm what you changed afterwards rather than asking permission first. " +
    "Settings apply from your next reply onward, not the one you are writing now.",

  parameters: {
    type: "object",
    properties: {
      plainLanguage: {
        type: "boolean",
        description: "True for short sentences and everyday words, with no recruitment jargon.",
      },
      answerLength: {
        type: "string",
        enum: Object.values(ANSWER_LENGTH),
        description: "'brief' for the answer alone, 'detailed' for full explanations, 'normal' in between.",
      },
      oneQuestionAtATime: {
        type: "boolean",
        description: "True to ask a single question per reply instead of presenting a list.",
      },
      autoReadAloud: { type: "boolean", description: "True to read every reply aloud without being asked." },
      voice: { type: "string", description: "Preferred read-aloud voice. Only set this if the user named one." },
      speechRate: {
        type: "number",
        description: `Read-aloud speed, where 1 is normal. Between ${SPEECH_RATE_MIN} and ${SPEECH_RATE_MAX}.`,
      },
    },
    required: [],
  },

  inputSchema: Joi.object({
    plainLanguage: Joi.boolean(),
    answerLength: Joi.string().valid(...Object.values(ANSWER_LENGTH)),
    oneQuestionAtATime: Joi.boolean(),
    autoReadAloud: Joi.boolean(),
    voice: Joi.string().trim().max(50),
    speechRate: Joi.number().min(SPEECH_RATE_MIN).max(SPEECH_RATE_MAX),
  })
    .min(1)
    .messages({ "object.min": "No preference was given to change." }),

  mutating: true,

  // See the file header. The only waiver of the confirmation gate in the module.
  requiresConfirmation: false,

  async execute(input, ctx: AgentToolContext) {
    const changes = compact({ ...input }) as Partial<AccessibilityPreferences>;

    if (Object.keys(changes).length === 0) {
      throw new BadRequestException("No preference was given to change. Ask the user what they would like adjusted.");
    }

    const ability = new UserAbilityBuilder(ctx.session).getAbility();
    const entity = new UserAuthZEntity({ _id: ctx.session.user._id, type: ctx.session.user.type as any });

    if (!ability.can(AbilityAction.Update, entity)) {
      throw new UnauthorizedException("You are not authorized to change these settings.");
    }

    // Checks the dotted paths actually being written, so the rule that keeps
    // these fields owner-only is enforced here and not merely relied upon.
    validateUpdatePayload(
      Object.fromEntries(Object.entries(changes).map(([key, value]) => [`accessibility.${key}`, value])),
      ability,
      AbilityAction.Update,
      entity
    );

    // Dotted `$set` rather than replacing the whole subdocument: the model sends
    // only what changed, and assigning the object would silently reset every
    // preference the user set in an earlier conversation.
    const updated = await User.findOneAndUpdate(
      { _id: ctx.session.user._id },
      { $set: Object.fromEntries(Object.entries(changes).map(([key, value]) => [`accessibility.${key}`, value])) },
      { new: true, runValidators: true }
    )
      .select("accessibility")
      .lean();

    return {
      saved: true,
      changed: Object.entries(changes).map(([key, value]) => describe(key as keyof SetAccessibilityInput, value)),
      preferences: { ...DEFAULT_ACCESSIBILITY_PREFERENCES, ...(updated?.accessibility ?? {}) },
      note: "Saved. These apply from your next reply onward, so do not rewrite the one you are working on — just confirm briefly what changed.",
    };
  },
};
