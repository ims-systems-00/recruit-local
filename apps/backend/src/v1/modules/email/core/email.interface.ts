export type EmailTemplateNames =
  | "account-recovery"
  | "account-verification"
  | "account-invitation"
  | "task-assigned"
  | "quotation"
  | "auditor-job-request";

export type Subject = string;
export type Receiver = string;
export type Payload = any;
export type Sender = string;
export interface EmailOptions {
  template: EmailTemplateNames;
  subject: Subject;
  payload: Payload;
}
export interface EmailConfiguration extends EmailOptions {
  receiver: Receiver;
  sender?: Sender;
}
