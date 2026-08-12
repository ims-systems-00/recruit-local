import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";

/**
 * Prompt names are addresses the runtime hardcodes, so keep them to a
 * predictable dotted-slug shape rather than free text.
 */
const nameSchema = Joi.string()
  .pattern(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/)
  .max(120)
  .messages({ "string.pattern.base": "Name must be lowercase words separated by dots or hyphens." })
  .label("Name");

/** Labels share the name shape minus dots — they end up in URLs. */
const labelSchema = Joi.string()
  .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(40)
  .messages({ "string.pattern.base": "Label must be lowercase words separated by hyphens." })
  .label("Label");

const configSchema = Joi.object({
  model: Joi.string().optional().label("Model"),
  temperature: Joi.number().min(0).max(2).optional().label("Temperature"),
}).label("Config");

/**
 * Creates the next version of `name`. `version` and `labels` are absent on
 * purpose — the service allocates the version and manages `latest`.
 */
export const createBodySchema = Joi.object({
  name: nameSchema.required(),
  content: Joi.string().required().label("Content"),
  commitMessage: Joi.string().max(500).optional().label("Commit Message"),
  config: configSchema.optional(),
});

/** Metadata only; content is immutable. */
export const updateBodySchema = Joi.object({
  commitMessage: Joi.string().max(500).optional().label("Commit Message"),
  config: configSchema.optional(),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

export const labelParamsSchema = Joi.object({
  name: nameSchema.required(),
  label: labelSchema.required(),
});

export const setLabelBodySchema = Joi.object({
  version: Joi.number().integer().min(1).required().label("Version"),
});

export const resolveQuerySchema = Joi.object({
  name: nameSchema.required(),
  label: labelSchema.optional(),
  variables: Joi.object().pattern(Joi.string(), Joi.string()).optional().label("Variables"),
});
