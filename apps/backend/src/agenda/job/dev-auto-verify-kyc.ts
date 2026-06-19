import type { Job as AgendaJob } from "agenda";
import { agenda } from "../config";
import { JOB_NAME } from "../constants";
import { KYC_STATUS } from "@rl/types";
import { logger } from "../../common/helper";
import * as kycService from "../../v1/modules/kyc/kyc.service";

export const defineDevAutoVerifyKycJob = () => {
  agenda.define(JOB_NAME.DEV_AUTO_VERIFY_KYC, async (agendaJob: AgendaJob<{ kycId: string }>) => {
    const { kycId } = agendaJob.attrs.data;

    try {
      await kycService.update({
        query: { _id: kycId },
        payload: { status: KYC_STATUS.VERIFIED },
      });

      logger.info(`[DEV] Auto-verified KYC ${kycId}`);
    } catch (error) {
      logger.error(`[DEV] Failed to auto-verify KYC ${kycId}:`, error);
      throw error;
    }
  });
};
