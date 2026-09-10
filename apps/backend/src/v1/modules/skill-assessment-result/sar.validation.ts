import Joi from "joi";

const objectId = Joi.string().hex().length(24);

const answerSchema = Joi.object({
  questionId: objectId.required().label("Question ID"),
  selectedOptionIndex: Joi.number().integer().min(0).optional().label("Selected Option Index"),
  answerText: Joi.string().trim().max(1000).optional().allow("").label("Answer Text"),
});

export const createSarBodySchema = Joi.object({
  skillAssessmentId: objectId.required().label("Skill Assessment ID"),
  jobProfileId: objectId.required().label("Job Profile ID"),
  answers: Joi.array().items(answerSchema).min(1).required().label("Answers"),
});

export const updateSarBodySchema = Joi.object({
  answers: Joi.array().items(answerSchema).min(1).optional().label("Answers"),
});

/**
 * The contract for `GET /skill-assessment-results`.
 *
 * `minScore`/`maxScore` and `sortBy` were declared here but MongoQuery ignored all
 * three, so none of them ever did anything. They work now. `score` was also in the
 * old `searchFields` — it is a Number, so the regex could never match it; the
 * search is `recommendations` only.
 */
export const sarListQuerySchema = Joi.object({
  cursor: Joi.string().trim().max(512),
  // Deprecated. Sending it returns the legacy offset block; omitting it returns a
  // cursor page.
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  // "asc"/"desc" were this key's old values. They are not sort tokens, so the
  // builder ignores them and falls back to the default.
  sort: Joi.string().valid("-createdAt", "createdAt", "-score", "score", "asc", "desc").default("-createdAt"),

  clientSearch: Joi.string().trim().max(200).allow(""),

  jobProfileId: objectId.label("Filter by Job Profile"),
  skillAssessmentId: objectId.label("Filter by Assessment"),

  minScore: Joi.number().min(0),
  maxScore: Joi.number().min(0),

  // Never applied by MongoQuery. Accept and drop.
  sortBy: Joi.any().strip(),
});
