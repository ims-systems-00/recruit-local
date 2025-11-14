import * as tokenService from "../token";
import * as verificationTokenService from "../verification-token";
import { AccountInvitaionEmail } from "../email";
import { VerificationToken } from "../../../models";
import { BadRequestException, logger, pick } from "../../../common/helper";
import { IListInvitationParams, IPayload } from "./invitation.interface";
import { getMatchAggregatorQuery, getProjectingAggregatorQuery } from "./invitation.query";
import { getUserTypeFromVerificationTokenType, getVerificationTokenType } from "./invitation.util";

export const listInvitation = async ({ query = {}, options }: IListInvitationParams) => {
  const aggregate = VerificationToken.aggregate([...getMatchAggregatorQuery(query), ...getProjectingAggregatorQuery()]);

  return VerificationToken.aggregatePaginate(aggregate, options);
};

export const createInvitation = async (payload: IPayload) => {
  const { userType, email, role, tenantId, createdBy } = payload;
  const tokenPayload = { userType, email, role, tenantId };

  // checkValidationInInvitation(userType);

  // create token
  const invitationToken = tokenService.generateToken({
    payload: tokenPayload,
    options: { expiresIn: process.env.INVITATION_TOKEN_EXPIRY },
  });

  // store token
  await verificationTokenService.create({
    token: invitationToken,
    email,
    type: getVerificationTokenType(userType),
    createdBy,
    tenantId: tenantId as any,
  });

  // send email
  const invitationLink = `${process.env.CLIENT_URL}/create-account?invitation_token=${invitationToken}`;

  logger.debug("Invitation Link: ", { invitationLink });

  const invitationEmail = new AccountInvitaionEmail({ link: invitationLink, userType });
  invitationEmail.to(email).send();
};

export const resendInvitation = async (id: string) => {
  const invitation = await verificationTokenService.findOne({ _id: id });
  if (!invitation) throw new BadRequestException("Invitation not found.");

  const { email, type } = invitation;
  const userType = getUserTypeFromVerificationTokenType(type);
  // userType, email, role, tenantId
  const tokenPayload = { userType, email };

  const invitationToken = tokenService.generateToken({
    payload: tokenPayload,
    options: { expiresIn: process.env.INVITATION_TOKEN_EXPIRY },
  });

  await verificationTokenService.update({ _id: id }, { token: invitationToken });

  const invitationLink = `${process.env.CLIENT_URL}/create-account?invitation_token=${invitationToken}`;
  const invitationEmail = new AccountInvitaionEmail({
    link: invitationLink,
    userType,
  });
  invitationEmail.to(email).send();
};

export const removeInvitation = async (id: string) => {
  const filter = { _id: id };
  const invitation = await verificationTokenService.findOne(filter);
  if (!invitation) throw new BadRequestException("Invitation not found.");

  const deletedInvitation = await verificationTokenService.remove(filter);
  return pick(deletedInvitation, ["_id", "email", "type", "createdAt", "updatedAt"]);
};
