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
    // `minYears`/`maxYears` are what the ranking pipeline compares against a
    // job's `yearOfExperience`; the descriptions are prose for humans and are
    // not parsed. The last level is open-ended (`maxYears: null`). Any change
    // here needs a matching migration — this seeder skips levels that already
    // exist, so it will not update a row that has been seeded before.
    const levels: ExperienceLevelInput[] = [
      {
        name: "Fresher",
        description: "No professional experience, entry-level candidates",
        minYears: 0,
        maxYears: 1,
      },
      { name: "Intermediate", description: "1–3 years of professional experience", minYears: 1, maxYears: 3 },
      {
        name: "Specialist",
        description: "3–5 years of deep expertise in a specific domain",
        minYears: 3,
        maxYears: 5,
      },
      {
        name: "Expert",
        description: "5–8 years of broad and deep professional experience",
        minYears: 5,
        maxYears: 8,
      },
      {
        name: "Lead",
        description: "8+ years with team leadership and mentoring responsibilities",
        minYears: 8,
        maxYears: 12,
      },
      {
        name: "Manager",
        description: "People or project management with cross-functional scope",
        minYears: 8,
        maxYears: 15,
      },
      {
        name: "Director",
        description: "Senior leadership overseeing departments or functions",
        minYears: 12,
        maxYears: 20,
      },
      { name: "Executive", description: "C-suite or VP level strategic leadership", minYears: 15, maxYears: null },
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
