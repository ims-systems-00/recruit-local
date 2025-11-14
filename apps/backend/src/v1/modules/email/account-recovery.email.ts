import { Email } from "./core";
export class AccountRecoveryEmail extends Email {
  constructor(payload: { link: string }) {
    super({
      template: "account-recovery",
      subject: "[Action required] Recover your account",
      payload,
    });
  }
}
