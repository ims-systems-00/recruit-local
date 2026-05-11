import { MEMBERSHIP_ROLE_ENUMS, USER_TYPE_ENUMS } from "../models/constants/types-enums.constant";

export interface ISession {
  user: {
    _id: string;
    fullName: string;
    type: USER_TYPE_ENUMS;
    role: MEMBERSHIP_ROLE_ENUMS;
    tenantId: string;
  };
}
