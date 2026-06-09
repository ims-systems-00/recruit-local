import { Value, ValueInput } from "../models";
import { ValueTypeEnum } from "@rl/types";
import { logger } from "../common/helper/logger";

const checkIfValueExists = async (type: string, label: string) => {
  return Value.findOne({ type, label });
};

const createValue = async (value: ValueInput) => {
  const newValue = new Value(value);
  return newValue.save();
};

export const valueSeeder = async () => {
  try {
    const values: ValueInput[] = [
      // Screen 1 — growth, learning, challenge, innovation
      { type: ValueTypeEnum.GROWTH, label: "Growth-oriented" },
      { type: ValueTypeEnum.INNOVATION, label: "Entrepreneurial" },
      { type: ValueTypeEnum.GROWTH, label: "Proactive" },
      { type: ValueTypeEnum.GROWTH, label: "Sales" },
      { type: ValueTypeEnum.CHALLENGE, label: "Resilient" },
      { type: ValueTypeEnum.GROWTH, label: "Data-driven" },
      { type: ValueTypeEnum.INNOVATION, label: "Innovative" },
      { type: ValueTypeEnum.CHALLENGE, label: "Problem solver" },
      { type: ValueTypeEnum.LEARNING, label: "Open-minded" },

      // Screen 2 — work, communicate, organize, contribute
      { type: ValueTypeEnum.WORK, label: "Ownership mentality" },
      { type: ValueTypeEnum.CONTRIBUTE, label: "Collaborative" },
      { type: ValueTypeEnum.WORK, label: "Independent" },
      { type: ValueTypeEnum.ORGANIZE, label: "Organised workflow" },
      { type: ValueTypeEnum.ORGANIZE, label: "Structured" },
      { type: ValueTypeEnum.WORK, label: "Fast-paced" },
      { type: ValueTypeEnum.WORK, label: "Flexible" },
      { type: ValueTypeEnum.ORGANIZE, label: "Detail-oriented" },
      { type: ValueTypeEnum.WORK, label: "Results-driven" },

      // Screen 3 — interpersonal, ethical, social
      { type: ValueTypeEnum.INTERPERSONAL, label: "Empathy" },
      { type: ValueTypeEnum.ETHICAL, label: "Integrity" },
      { type: ValueTypeEnum.INTERPERSONAL, label: "Respect" },
      { type: ValueTypeEnum.SOCIAL, label: "Diversity-minded" },
      { type: ValueTypeEnum.INTERPERSONAL, label: "Psychological safety" },
      { type: ValueTypeEnum.ETHICAL, label: "Fairness" },
      { type: ValueTypeEnum.SOCIAL, label: "Community-oriented" },
      { type: ValueTypeEnum.INTERPERSONAL, label: "Humility" },
      { type: ValueTypeEnum.ETHICAL, label: "Ethical leadership" },

      // Screen 4 — performance, development, collaboration
      { type: ValueTypeEnum.DEVELOPMENT, label: "Mentorship" },
      { type: ValueTypeEnum.DEVELOPMENT, label: "Coaching culture" },
      { type: ValueTypeEnum.COLLABORATION, label: "Empowerment" },
      { type: ValueTypeEnum.PERFORMANCE, label: "High-performance culture" },
      { type: ValueTypeEnum.PERFORMANCE, label: "Team accountability" },
      { type: ValueTypeEnum.COLLABORATION, label: "Servant leadership" },
      { type: ValueTypeEnum.DEVELOPMENT, label: "Feedback culture" },
      { type: ValueTypeEnum.PERFORMANCE, label: "Recognition culture" },

      // Screen 5 — motivation, meaning, fulfilment
      { type: ValueTypeEnum.MOTIVATION, label: "Career progression" },
      { type: ValueTypeEnum.MEANING, label: "Stability" },
      { type: ValueTypeEnum.MOTIVATION, label: "Innovation" },
      { type: ValueTypeEnum.MEANING, label: "Social good" },
      { type: ValueTypeEnum.MOTIVATION, label: "Creativity" },
      { type: ValueTypeEnum.FULFILMENT, label: "Autonomy" },
      { type: ValueTypeEnum.MOTIVATION, label: "Learning opportunities" },
      { type: ValueTypeEnum.MOTIVATION, label: "Leadership opportunities" },
      { type: ValueTypeEnum.FULFILMENT, label: "Recognition" },
    ];

    await Promise.all(
      values.map(async (valueData) => {
        const existing = await checkIfValueExists(valueData.type, valueData.label);
        if (!existing) {
          await createValue(valueData);
        }
      })
    );

    logger.info("Value seeding completed.");
  } catch (error) {
    logger.error("Error seeding values", error);
  }
};
