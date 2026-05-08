import Joi from "joi";

export const querySchema = Joi.object({
  url: Joi.string().required().label("URL"),
});
