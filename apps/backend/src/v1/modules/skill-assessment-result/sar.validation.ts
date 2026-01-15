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

export const sarListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),

  jobProfileId: objectId.optional().label("Filter by Job Profile"),
  skillAssessmentId: objectId.optional().label("Filter by Assessment"),

  minScore: Joi.number().min(0).optional(),
  maxScore: Joi.number().min(0).optional(),

  sort: Joi.string().valid("desc", "asc").default("desc"),
  sortBy: Joi.string().valid("createdAt", "score").default("createdAt"),
});
