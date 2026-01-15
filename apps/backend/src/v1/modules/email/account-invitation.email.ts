import { ACCOUNT_TYPE_ENUMS } from "@rl/types";
import { Email } from "./core";

export class AccountInvitaionEmail extends Email {
  constructor(payload: { link: string; userType: ACCOUNT_TYPE_ENUMS }) {
    super({
      template: "account-invitation",
      subject: "[Invitation] Join Interface NRM portal",
      payload,
    });
  }
}
