import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

// Import your queues
import { deadLetterQueue } from "../queue/Queue";
import { thumbnailCreateQueue } from "../queue/thumbnailCreateQueue";
import { fileDeleteQueue } from "../queue/fileDeleteQueue";
import { salaryUpdateQueue } from "../queue/salaryUpdateQueue";
import { valueWeightUpdateQueue } from "../queue/valueWeightUpdateQueue";
import { keywordUpdateQueue } from "../queue/keywordUpdateQueue";
import { jobFanoutQueue } from "../queue/jobFanoutQueue";
import { profileFeedRebuildQueue } from "../queue/profileFeedRebuildQueue";
import { postFanoutQueue } from "../queue/postFanoutQueue";
import { postFeedRebuildQueue } from "../queue/postFeedRebuildQueue";
import { emailQueue } from "../v1/modules/email/core/email.queue";

export const initBullBoard = () => {
  const serverAdapter = new ExpressAdapter();
  const BOARD_PATH = "/admin/queues";

  // Bull Board requires the base path to be set explicitly
  serverAdapter.setBasePath(BOARD_PATH);

  createBullBoard({
    queues: [
      new BullMQAdapter(deadLetterQueue),
      new BullMQAdapter(thumbnailCreateQueue.queue),
      new BullMQAdapter(fileDeleteQueue.queue),
      new BullMQAdapter(salaryUpdateQueue.queue),
      new BullMQAdapter(valueWeightUpdateQueue.queue),
      new BullMQAdapter(keywordUpdateQueue.queue),
      new BullMQAdapter(jobFanoutQueue.queue),
      new BullMQAdapter(profileFeedRebuildQueue.queue),
      new BullMQAdapter(postFanoutQueue.queue),
      new BullMQAdapter(postFeedRebuildQueue.queue),
      new BullMQAdapter(emailQueue.queue),
    ],
    serverAdapter: serverAdapter,
  });

  return {
    router: serverAdapter.getRouter(),
    path: BOARD_PATH,
  };
};
