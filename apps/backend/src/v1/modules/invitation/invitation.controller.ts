import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import * as invitationService from "./invitation.service";
import { ApiResponse, ControllerParams, formatListResponse } from "../../../common/helper";
import { USER_TYPE_ENUMS } from "../../../models/constants";
import { USER_ROLE_ENUMS } from "@inrm/types";

type InvitationPayload = {
  type: USER_TYPE_ENUMS;
  email: string;
  role: USER_ROLE_ENUMS;
  tenantId: string;
};

export const listInvitation = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["email"],
    strictObjectIdMatch: true,
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const results = await invitationService.listInvitation({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Invitation list retrieved.",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "invitations",
    pagination,
  });
};

export const createInvitation = async ({ req }: ControllerParams) => {
  const payloads: InvitationPayload[] = req.body;

  await Promise.all(
    payloads.map((payload) => invitationService.createInvitation({ ...payload, createdBy: req.session.user.id }))
  );

  return new ApiResponse({
    message: "Invitation sent successfully.",
    statusCode: StatusCodes.CREATED,
  });
};

export const removeInvitation = async ({ req }: ControllerParams) => {
  const invitation = await invitationService.removeInvitation(req.params.id);

  return new ApiResponse({
    message: "Invitation removed.",
    statusCode: StatusCodes.OK,
    data: invitation,
    fieldName: "invitation",
  });
};
