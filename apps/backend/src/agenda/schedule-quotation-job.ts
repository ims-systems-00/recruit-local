import Agenda from "agenda";
import { JOB_NAME } from "./constants";
import { QuotationEmail } from "../v1/modules/email";
import { Quotation } from "../models/quotations.model";
import { QUOTATION_STATUS_ENUMS } from "@inrm/types";

export const scheduleQuotationJob = async (agenda: Agenda) => {
  agenda.define(JOB_NAME.SCHEDULE_QUOTATION, async (job) => {
    console.log("Executing schedule quotation job");
    const { quotationId, senderName, recipientEmail, quotationLink, quotationTitle } = job.attrs.data;
    const email = new QuotationEmail({
      senderName,
      quotationId,
      quotationLink,
      quotationTitle,
    });
    email.to(recipientEmail).send();

    // Clear job ID from quotation after successful execution
    await Quotation.findByIdAndUpdate(quotationId, {
      $unset: { scheduledJobId: 1, scheduleDate: 1 },
      $set: { status: QUOTATION_STATUS_ENUMS.SENT, lastSentAt: new Date() },
    });
  });
};
