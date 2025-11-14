import { Email } from "./core";

interface QuotationPayload {
  senderName: string;
  quotationId: string;
  quotationLink: string;
  quotationTitle: string;
}

export class QuotationEmail extends Email {
  constructor(payload: QuotationPayload) {
    super({
      template: "quotation",
      subject: "[Quotation] Quotation sending to you",
      payload,
    });
  }
}
