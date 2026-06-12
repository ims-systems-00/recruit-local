import { Value, ValueInput } from "../models";
import { VALUE_TYPE_ENUM } from "@rl/types";
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
      { type: VALUE_TYPE_ENUM.GROWTH, label: "Growth-oriented" },
      { type: VALUE_TYPE_ENUM.INNOVATION, label: "Entrepreneurial" },
      { type: VALUE_TYPE_ENUM.GROWTH, label: "Proactive" },
      { type: VALUE_TYPE_ENUM.GROWTH, label: "Sales" },
      { type: VALUE_TYPE_ENUM.CHALLENGE, label: "Resilient" },
      { type: VALUE_TYPE_ENUM.GROWTH, label: "Data-driven" },
      { type: VALUE_TYPE_ENUM.INNOVATION, label: "Innovative" },
      { type: VALUE_TYPE_ENUM.CHALLENGE, label: "Problem solver" },
      { type: VALUE_TYPE_ENUM.LEARNING, label: "Open-minded" },

      // Screen 2 — work, communicate, organize, contribute
      { type: VALUE_TYPE_ENUM.WORK, label: "Ownership mentality" },
      { type: VALUE_TYPE_ENUM.CONTRIBUTE, label: "Collaborative" },
      { type: VALUE_TYPE_ENUM.WORK, label: "Independent" },
      { type: VALUE_TYPE_ENUM.ORGANIZE, label: "Organised workflow" },
      { type: VALUE_TYPE_ENUM.ORGANIZE, label: "Structured" },
      { type: VALUE_TYPE_ENUM.WORK, label: "Fast-paced" },
      { type: VALUE_TYPE_ENUM.WORK, label: "Flexible" },
      { type: VALUE_TYPE_ENUM.ORGANIZE, label: "Detail-oriented" },
      { type: VALUE_TYPE_ENUM.WORK, label: "Results-driven" },

      // Screen 3 — interpersonal, ethical, social
      { type: VALUE_TYPE_ENUM.INTERPERSONAL, label: "Empathy" },
      { type: VALUE_TYPE_ENUM.ETHICAL, label: "Integrity" },
      { type: VALUE_TYPE_ENUM.INTERPERSONAL, label: "Respect" },
      { type: VALUE_TYPE_ENUM.SOCIAL, label: "Diversity-minded" },
      { type: VALUE_TYPE_ENUM.INTERPERSONAL, label: "Psychological safety" },
      { type: VALUE_TYPE_ENUM.ETHICAL, label: "Fairness" },
      { type: VALUE_TYPE_ENUM.SOCIAL, label: "Community-oriented" },
      { type: VALUE_TYPE_ENUM.INTERPERSONAL, label: "Humility" },
      { type: VALUE_TYPE_ENUM.ETHICAL, label: "Ethical leadership" },

      // Screen 4 — performance, development, collaboration
      { type: VALUE_TYPE_ENUM.DEVELOPMENT, label: "Mentorship" },
      { type: VALUE_TYPE_ENUM.DEVELOPMENT, label: "Coaching culture" },
      { type: VALUE_TYPE_ENUM.COLLABORATION, label: "Empowerment" },
      { type: VALUE_TYPE_ENUM.PERFORMANCE, label: "High-performance culture" },
      { type: VALUE_TYPE_ENUM.PERFORMANCE, label: "Team accountability" },
      { type: VALUE_TYPE_ENUM.COLLABORATION, label: "Servant leadership" },
      { type: VALUE_TYPE_ENUM.DEVELOPMENT, label: "Feedback culture" },
      { type: VALUE_TYPE_ENUM.PERFORMANCE, label: "Recognition culture" },

      // Screen 5 — motivation, meaning, fulfilment
      { type: VALUE_TYPE_ENUM.MOTIVATION, label: "Career progression" },
      { type: VALUE_TYPE_ENUM.MEANING, label: "Stability" },
      { type: VALUE_TYPE_ENUM.MOTIVATION, label: "Innovation" },
      { type: VALUE_TYPE_ENUM.MEANING, label: "Social good" },
      { type: VALUE_TYPE_ENUM.MOTIVATION, label: "Creativity" },
      { type: VALUE_TYPE_ENUM.FULFILMENT, label: "Autonomy" },
      { type: VALUE_TYPE_ENUM.MOTIVATION, label: "Learning opportunities" },
      { type: VALUE_TYPE_ENUM.MOTIVATION, label: "Leadership opportunities" },
      { type: VALUE_TYPE_ENUM.FULFILMENT, label: "Recognition" },
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
