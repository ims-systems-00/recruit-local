import { Types } from "mongoose";
import { Value } from "../models";
import { ReusableQueue } from "./Queue";

export interface ValueWeightUpdateJobData {
  valueIds: string[];
}

const processValueWeightUpdate = async (valueIds: string[]) => {
  if (!valueIds?.length) return;

  const ids = valueIds.map((id) => id?.toString().trim()).filter((id): id is string => Types.ObjectId.isValid(id));

  if (!ids.length) return;

  // Increment the weight of every value referenced by the job profile by +1.
  await Value.updateMany({ _id: { $in: ids } }, { $inc: { weight: 1 } });
};

export const valueWeightUpdateQueue = new ReusableQueue<ValueWeightUpdateJobData>("value-weight-update-queue", (job) =>
  processValueWeightUpdate(job.data.valueIds)
);
