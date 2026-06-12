import { Job } from "bullmq";
import { Value } from "../models";
import { ReusableQueue } from "./Queue";

export interface ValueWeightUpdateJobData {
  labels: string[];
}

const processValueWeightUpdate = async (job: Job<ValueWeightUpdateJobData>) => {
  const { labels } = job.data;
  if (!labels?.length) return;

  const cleanedLabels = labels.map((label) => label?.trim()).filter((label): label is string => Boolean(label));

  // Increment the weight of every value matching each provided label by +1.
  await Promise.all(cleanedLabels.map((label) => Value.updateMany({ label }, { $inc: { weight: 1 } })));
};

export const valueWeightUpdateQueue = new ReusableQueue<ValueWeightUpdateJobData>(
  "value-weight-update-queue",
  processValueWeightUpdate
);
