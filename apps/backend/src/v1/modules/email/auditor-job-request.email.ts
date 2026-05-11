import { Email } from "./core";

interface QuotationPayload {
  title: string;
  description: string;
  link: string;
}

export class AuditorJobRequestEmail extends Email {
  constructor(payload: QuotationPayload) {
    super({
      template: "auditor-job-request",
      subject: "[Job Request] Job request for you",
      payload,
    });
  }
}
