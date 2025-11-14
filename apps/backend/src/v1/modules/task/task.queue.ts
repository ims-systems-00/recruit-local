import Bull, { Queue } from "bull";
import { Task } from "../../../models/tasks.model";
import { User } from "../../../models/user.model";
import { TASK_STATUS_ENUMS } from "@inrm/types";

// Configure the Redis connection
export const taskScheduleQueue: Queue = new Bull("task-schedule-queue", {
  redis: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
});

// Process the email queue
taskScheduleQueue.process(async () => {
  try {
    const emails = [
      "charlotte@interface-nrm.co.uk",
      "rob@interface-nrm.co.uk",
      "hannah@interface-nrm.co.uk",
      "ryan@interface-nrm.co.uk",
    ];

    // Execute all user queries in parallel
    const userPromises = emails.map((email) => User.findOne({ email }));

    const users = await Promise.all(userPromises);
    const userIds = users.map((user) => user._id!).filter(Boolean);

    const task = new Task({
      title: "Send client onboarding form",
      description: "Welcome the client and provide onboarding resources.",
      status: TASK_STATUS_ENUMS.IN_PROGRESS,
      assignedTo: userIds,
    });

    await task.save();
  } catch (error) {
    throw error;
  }
});

export async function enqueueTaskSchedule() {
  taskScheduleQueue.add({});
}

// Error handling
taskScheduleQueue.on("completed", (job) => {
  console.log(`Task schedule completed for ${job.id}`);
});

taskScheduleQueue.on("failed", (job, err) => {
  console.error(`Task schedule failed for ${job?.id}:`, err);
});
