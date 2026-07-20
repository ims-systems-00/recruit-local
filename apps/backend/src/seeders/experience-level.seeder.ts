import { ExperienceLevel, ExperienceLevelInput } from "../models";
import { logger } from "../common/helper/logger";

const checkIfExperienceLevelExists = async (name: string) => {
  return ExperienceLevel.findOne({ name });
};

const createExperienceLevel = async (level: ExperienceLevelInput) => {
  const newLevel = new ExperienceLevel(level);
  return newLevel.save();
};

export const experienceLevelSeeder = async () => {
  try {
    const levels: ExperienceLevelInput[] = [
      { name: "Fresher", description: "No professional experience, entry-level candidates" },
      { name: "Intermediate", description: "1–3 years of professional experience" },
      { name: "Specialist", description: "3–5 years of deep expertise in a specific domain" },
      { name: "Expert", description: "5–8 years of broad and deep professional experience" },
      { name: "Lead", description: "8+ years with team leadership and mentoring responsibilities" },
      { name: "Manager", description: "People or project management with cross-functional scope" },
      { name: "Director", description: "Senior leadership overseeing departments or functions" },
      { name: "Executive", description: "C-suite or VP level strategic leadership" },
    ];

    await Promise.all(
      levels.map(async (levelData) => {
        const existing = await checkIfExperienceLevelExists(levelData.name);
        if (!existing) {
          await createExperienceLevel(levelData);
        }
      })
    );

    logger.info("Experience level seeding completed.");
  } catch (error) {
    logger.error("Error seeding experience levels", error);
  }
};
