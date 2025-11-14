import { USER_TYPE_ENUMS } from "../../../models/constants";
import { Email } from "./core";

export class AccountInvitaionEmail extends Email {
  constructor(payload: { link: string; userType: USER_TYPE_ENUMS }) {
    super({
      template: "account-invitation",
      subject: "[Invitation] Join Interface NRM portal",
      payload,
    });
  }
}
