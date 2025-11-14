import Joi from "joi";

export const registerBodySchema = Joi.object({
  firstName: Joi.string().max(20).required().label("First Name"),
  lastName: Joi.string().max(20).required().label("Last Name"),
  email: Joi.string().max(50).email().required().label("Email"),
  password: Joi.string().min(8).max(50).required().label("Password"),
  invitationToken: Joi.string().optional().label("Invitation Token"),
  voIPNumber: Joi.string()
    .optional()
    .pattern(/^\+44\d{11}$/)
    .label("VoIP Number")
    .messages({
      "string.pattern.base": "VoIP Number must be a valid UK phone number",
    }),
});

export const verifyRegistrationQuerySchema = Joi.object({
  registration_token: Joi.string().required().label("Registration Token"),
});

export const resendVerificationBodySchema = Joi.object({
  email: Joi.string().max(50).email().required().label("Email"),
});

export const recoverAccountBodySchema = Joi.object({
  email: Joi.string().max(50).email().required().label("Email"),
});

export const verifyRecoveryQuerySchema = Joi.object({
  recovery_token: Joi.string().required().label("Recovery Token"),
});

export const verifyRecoveryBodySchema = Joi.object({
  password: Joi.string().min(8).max(50).required().label("Password"),
});

export const loginBodySchema = Joi.object({
  email: Joi.string().max(50).email().required().label("Email"),
  password: Joi.string().min(8).max(50).required().label("Password"),
});

export const logoutCookieSchema = Joi.object({
  __imsat__: Joi.string().optional().label("Access Token"),
  __imsrt__: Joi.string().optional().label("Refresh Token"),
});

export const refreshAccessTokenCookieSchema = Joi.object({
  __imsat__: Joi.string().optional().label("Access Token"),
  __imsrt__: Joi.string().optional().label("Refresh Token"),
});
