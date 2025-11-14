import Joi from "joi";
import { USER_TYPE_ENUMS, USER_ROLE_ENUMS, VERIFICATION_TOKEN_TYPE_ENUMS } from "@inrm/types";

export const invitationBodySchema = Joi.array()
  .items(
    Joi.object({
      userType: Joi.string()
        .valid(...Object.values(USER_TYPE_ENUMS))
        .required()
        .label("User Type"),
      email: Joi.string().email().required().label("Email"),
      role: Joi.string()
        .valid(...Object.values(USER_ROLE_ENUMS))
        .when("userType", {
          is: USER_TYPE_ENUMS.CUSTOMER,
          then: Joi.required(),
          otherwise: Joi.optional(),
        })
        .label("Role"),
      tenantId: Joi.string()
        .when("userType", {
          is: USER_TYPE_ENUMS.CUSTOMER,
          then: Joi.required(),
          otherwise: Joi.optional(),
        })
        .label("Tenant Id"),
    })
  )
  .min(1)
  .label("Invitations");

export const invitationQuerySchema = Joi.object({
  email: Joi.string().email().optional().label("Email"),
  type: Joi.string()
    .valid(
      VERIFICATION_TOKEN_TYPE_ENUMS.INVITATION_IN_CLIENT_ORG,
      VERIFICATION_TOKEN_TYPE_ENUMS.INVITATION_IN_INTERFACE_NRM,
      VERIFICATION_TOKEN_TYPE_ENUMS.INVITATION_IN_AUDIT
    )
    .optional()
    .label("Type"),
  clientSearch: Joi.any().optional().allow(null).label("Client Search"),
  tenantId: Joi.string().optional().label("Tenant ID"),
  page: Joi.number().integer().min(1).optional().label("Page"),
  limit: Joi.number().integer().min(1).optional().label("Limit"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().required().label("Invitation ID"),
});
