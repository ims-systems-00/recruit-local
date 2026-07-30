import { agenda } from "../config";
import { JOB_NAME } from "../constants";
import { logger } from "../../common/helper";
import { AgentConversation, AgentMessage } from "../../models";

/** How long a soft-deleted conversation is kept before it is destroyed. */
const RETENTION_DAYS = 30;

/**
 * Hard-deletes soft-deleted agent conversations and their transcripts.
 *
 * Transcripts hold tool output — candidate names, emails, profile summaries —
 * so a soft delete alone is not enough to call the data gone.
 *
 * This is the first recurring Agenda job in the codebase; everything else uses
 * `agenda.schedule` for one-shots. Hence `agenda.every` in the definer below.
 */
export const definePurgeAgentConversationsJob = () => {
  agenda.define(JOB_NAME.PURGE_AGENT_CONVERSATIONS, async () => {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

    try {
      const expired = await AgentConversation.find(
        { "deleteMarker.status": true, "deleteMarker.deletedAt": { $lt: cutoff } },
        { _id: 1 }
      ).lean();

      if (expired.length === 0) return;

      const conversationIds = expired.map((conversation) => conversation._id);

      const { deletedCount: messagesDeleted } = await AgentMessage.deleteMany({
        conversationId: { $in: conversationIds },
      });
      const { deletedCount: conversationsDeleted } = await AgentConversation.deleteMany({
        _id: { $in: conversationIds },
      });

      logger.info(
        `[purge-agent-conversations] Purged ${conversationsDeleted} conversations and ${messagesDeleted} messages older than ${RETENTION_DAYS} days.`
      );
    } catch (error) {
      logger.error("[purge-agent-conversations] Failed to purge agent conversations:", error);
      throw error;
    }
  });
};

export const schedulePurgeAgentConversationsJob = async () => {
  await agenda.every("24 hours", JOB_NAME.PURGE_AGENT_CONVERSATIONS);
};
