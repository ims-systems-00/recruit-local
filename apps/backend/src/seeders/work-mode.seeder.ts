import { WorkMode, WorkModeInput } from "../models";
import { logger } from "../common/helper/logger";

const checkIfWorkModeExists = async (name: string) => {
  return WorkMode.findOne({ name });
};

const createWorkMode = async (workMode: WorkModeInput) => {
  const newWorkMode = new WorkMode(workMode);
  return newWorkMode.save();
};

export const workModeSeeder = async () => {
  try {
    const workModes: WorkModeInput[] = [
      { name: "Hybrid", description: "Mix of onsite and remote work" },
      { name: "Onsite", description: "Fully office-based work" },
      { name: "Remote", description: "Fully remote, work from anywhere" },
    ];

    await Promise.all(
      workModes.map(async (workModeData) => {
        const existing = await checkIfWorkModeExists(workModeData.name);
        if (!existing) {
          await createWorkMode(workModeData);
        }
      })
    );

    logger.info("Work mode seeding completed.");
  } catch (error) {
    logger.error("Error seeding work modes", error);
  }
};
