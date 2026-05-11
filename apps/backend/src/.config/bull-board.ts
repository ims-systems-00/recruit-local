import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

// Import your queues
import { deadLetterQueue } from "../queue/Queue";
import { thumbnailCreateQueue } from "../queue/thumbnailCreateQueue";
import { fileDeleteQueue } from "../queue/fileDeleteQueue";

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
    ],
    serverAdapter: serverAdapter,
  });

  return {
    router: serverAdapter.getRouter(),
    path: BOARD_PATH,
  };
};
