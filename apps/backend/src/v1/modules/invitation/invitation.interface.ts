import { VerificationTokenInput } from "../../../models";
import { USER_ROLE_ENUMS, USER_TYPE_ENUMS } from "@inrm/types";

export type Query = Partial<VerificationTokenInput & { _id: string }>;

export interface IOptions {
  page?: number;
  limit?: number;
}

export interface IListInvitationParams {
  query: Query;
  options?: IOptions;
}

export interface IPayload {
  type: USER_TYPE_ENUMS;
  email: string;
  role: USER_ROLE_ENUMS;
  tenantId: string;
  createdBy?: any;
}
