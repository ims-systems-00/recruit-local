import { Status, IStatusInput } from "../models";
import { modelNames } from "../models/constants";
import { logger } from "../common/helper/logger";

const checkIfStatusExists = async (collectionName: string, label: string) => {
  // check for uniqueness based on the Entity (collectionName) and the Label
  return Status.findOne({ collectionName, label });
};

const createStatus = async (status: IStatusInput) => {
  const newStatus = new Status(status);
  return newStatus.save();
};

export const statusSeeder = async () => {
  try {
    // Define your master statuses here
    // Note: We usually don't seed 'collectionId' unless checking for a specific system resource
    const statuses: IStatusInput[] = [
      // Job Profile Statuses
      {
        collectionName: modelNames.JOB_PROFILE,
        label: "verified",
        // weight: 1,
      },
      {
        collectionName: modelNames.JOB_PROFILE,
        label: "unverified",
        // weight: 1,
      },
      {
        collectionName: modelNames.JOB_PROFILE,
        label: "pending",
        // weight: 1,
      },
      {
        collectionName: modelNames.JOB_PROFILE,
        label: "rejected",
        // weight: 1,
      },
    ];

    await Promise.all(
      statuses.map(async (statusData) => {
        const existingStatus = await checkIfStatusExists(statusData.collectionName, statusData.label);

        if (!existingStatus) {
          await createStatus(statusData);
        }
      })
    );

    logger.info("Status seeding completed.");
  } catch (error) {
    logger.error("Error seeding statuses", error);
  }
};
