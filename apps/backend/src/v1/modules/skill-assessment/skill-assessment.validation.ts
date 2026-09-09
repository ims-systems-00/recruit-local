import Joi from "joi";
import { SKILL_ASSESSMENT_LEVEL_ENUM, SKILL_ASSESSMENT_CATEGORY_ENUM, QUESTION_TYPE_ENUM } from "@rl/types";

const questionSchema = Joi.object({
  questionText: Joi.string().required().trim().label("Question Text"),

  type: Joi.string()
    .valid(...Object.values(QUESTION_TYPE_ENUM))
    .required()
    .label("Question Type"),
  points: Joi.number().integer().min(1).required().label("Points"),

  // Only allowed if type is SHORT_ANSWER
  correctAnswerText: Joi.when("type", {
    is: QUESTION_TYPE_ENUM.SHORT_ANSWER,
    then: Joi.string().required(),
    otherwise: Joi.any().strip(),
  }),

  //  Logic for MCQ vs True/False
  options: Joi.when("type", {
    is: QUESTION_TYPE_ENUM.MULTIPLE_CHOICE,
    then: Joi.array().items(Joi.string()).min(2).required(),
    otherwise: Joi.when("type", {
      is: QUESTION_TYPE_ENUM.TRUE_FALSE,
      then: Joi.array().items(Joi.string()).length(2).required(),
      otherwise: Joi.any().strip(),
    }),
  }),

  // Only allowed for MCQ and True/False
  correctOptionIndex: Joi.when("type", {
    is: Joi.valid(QUESTION_TYPE_ENUM.MULTIPLE_CHOICE, QUESTION_TYPE_ENUM.TRUE_FALSE),
    then: Joi.number().integer().min(0).required(),
    otherwise: Joi.any().strip(),
  }),
});

export const createSkillAssessmentBodySchema = Joi.object({
  title: Joi.string().trim().min(3).max(255).required().label("Title"),
  description: Joi.string().trim().max(1000).optional().allow("").label("Description"),
  level: Joi.string()
    .valid(...Object.values(SKILL_ASSESSMENT_LEVEL_ENUM))
    .required()
    .label("Level"),
  category: Joi.string()
    .valid(...Object.values(SKILL_ASSESSMENT_CATEGORY_ENUM))
    .required()
    .label("Category"),
  questions: Joi.array().items(questionSchema).min(1).required().label("Questions"),
  attachment: Joi.object({
    key: Joi.string().required(),
    url: Joi.string().uri().required(),
    name: Joi.string().optional(),
    mimeType: Joi.string().optional(),
    size: Joi.number().optional(),
  })
    .optional()
    .label("Attachment"),
});

export const updateSkillAssessmentBodySchema = Joi.object({
  title: Joi.string().trim().min(3).max(255).optional(),
  description: Joi.string().trim().max(1000).optional().allow(""),
  level: Joi.string()
    .valid(...Object.values(SKILL_ASSESSMENT_LEVEL_ENUM))
    .optional(),
  category: Joi.string()
    .valid(...Object.values(SKILL_ASSESSMENT_CATEGORY_ENUM))
    .optional(),
  questions: Joi.array().items(questionSchema).min(1).optional(),
  attachment: Joi.object().optional().allow(null),
});

// Schema for filtering/pagination
export const skillAssessmentListQuerySchema = Joi.object({
  cursor: Joi.string().trim().max(512),
  // Deprecated. Sending it returns the legacy offset block; omitting it returns a
  // cursor page.
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid("-createdAt", "createdAt", "title", "-title").default("-createdAt"),

  clientSearch: Joi.string().trim().max(200).allow(""),
  search: Joi.string().trim().max(200).allow(""),

  level: Joi.string().valid(...Object.values(SKILL_ASSESSMENT_LEVEL_ENUM)),
  category: Joi.string().valid(...Object.values(SKILL_ASSESSMENT_CATEGORY_ENUM)),
})
  // The old schema declared `search`, but MongoQuery read `clientSearch` — which
  // this schema rejected. So search was unreachable here. Renaming keeps any
  // caller sending `search` working while the rest of the codebase stays on
  // `clientSearch`. `override` must be true: with it false, a caller sending both
  // keys gets a 400 rather than a search.
  .rename("search", "clientSearch", { ignoreUndefined: true, override: true });
