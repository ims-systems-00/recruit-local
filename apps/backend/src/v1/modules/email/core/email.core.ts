import { emailQueue } from "./email.queue";
import { EmailOptions, EmailTemplateNames } from "./email.interface";
import { EmailMissConfigException, validate } from "../../../../common/helper";
import Joi from "joi";

export class Email {
  private receiver: string;
  private payload: any; // Define a more specific type for payload if needed
  private sender: string | undefined;
  private subject: string;
  private template: EmailTemplateNames;
  private scheduleDate: Date | undefined;

  constructor({ template, subject, payload }: EmailOptions) {
    this.template = template;
    this.subject = subject;
    this.payload = payload;
    this.sender = process.env.EMAIL_SENDER || "default@example.com";
  }

  public to(receiver: string) {
    this.receiver = receiver;
    return this;
  }
  public withAttachments(attachments: any[]) {
    return this;
  }
  public schedule(date: Date) {
    this.scheduleDate = new Date(date);
    return this;
  }

  public send() {
    const errors = validate(Joi.string().email(), this.receiver);
    if (errors) throw new EmailMissConfigException("Invaild receiver email configured: " + this.receiver);
    const now = new Date();
    if (this.scheduleDate && this.scheduleDate < now) {
      throw new EmailMissConfigException("Scheduled date cannot be in the past.");
    }
    const delay = this.scheduleDate ? this.scheduleDate.getTime() - now.getTime() : 0;

    emailQueue.add(
      {
        receiver: this.receiver,
        sender: this.sender,
        subject: this.subject,
        template: this.template,
        payload: this.payload,
      },
      {
        delay,
      }
    );
    return this;
  }
}
