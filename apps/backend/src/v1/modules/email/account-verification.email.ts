import { Email } from "./core";
export class AccountVerificationEmail extends Email {
  constructor(payload: { link: string }) {
    super({
      template: "account-verification",
      subject: "[Verify] Account verifications required",
      payload,
    });
  }
}
