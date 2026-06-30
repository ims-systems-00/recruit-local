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

const labelsByType: Record<VALUE_TYPE_ENUM, string[]> = {
  [VALUE_TYPE_ENUM.WORKING_STYLE]: [
    "Independent",
    "Fast-paced",
    "Structured",
    "Detail-oriented",
    "Methodical",
    "Results-driven",
    "Reliable",
    "Self-starter",
    "Hands-on",
    "Efficient",
    "Disciplined",
    "Flexible",
    "Time management",
    "Prioritisation",
    "Process-driven",
    "Accountable",
    "Resourceful",
    "Quality-focused",
    "Deadline-driven",
    "Execution-focused",
  ],
  [VALUE_TYPE_ENUM.MINDSET]: [
    "Growth-oriented",
    "Curious",
    "Open-minded",
    "Resilient",
    "Ambitious",
    "Innovative",
    "Creative",
    "Problem solver",
    "Proactive",
    "Lifelong learner",
    "Determined",
    "Adaptable",
    "Visionary",
    "Entrepreneurial",
    "Coachable",
    "Risk-taker",
    "Forward-thinking",
    "Continuous improvement",
    "Comfortable with ambiguity",
    "Achievement-oriented",
  ],
  [VALUE_TYPE_ENUM.CULTURE_AND_BEHAVIOR]: [
    "Integrity",
    "Empathy",
    "Respect",
    "Inclusive",
    "Fairness",
    "Trustworthy",
    "Honesty",
    "Accountability",
    "Transparency",
    "Psychological safety",
    "Humility",
    "Diversity-minded",
    "Socially responsible",
    "Emotional intelligence",
    "Principled",
    "Compassionate",
    "Authentic",
    "Values-driven",
    "Community-oriented",
    "Conflict resolution",
  ],
  [VALUE_TYPE_ENUM.LEADERSHIP]: [
    "Mentorship",
    "Servant leadership",
    "Empowerment",
    "Coaching culture",
    "Visionary leadership",
    "Strategic thinking",
    "Decision-making",
    "Feedback culture",
    "Talent growth",
    "Leading by example",
    "High-performance culture",
    "Delegation",
    "Inspiring others",
    "Succession planning",
    "Setting direction",
    "Recognition culture",
    "Developing others",
    "Ownership of outcomes",
    "Raising the bar",
    "Accountability for results",
  ],
  [VALUE_TYPE_ENUM.MOTIVATION]: [
    "Purpose-driven",
    "Goal-oriented",
    "Passionate",
    "Self-motivated",
    "Driven",
    "Impact-focused",
    "Mission-aligned",
    "Recognition-seeking",
    "Growth-motivated",
    "Achievement-focused",
    "Intrinsically motivated",
    "Ambitious",
    "Enthusiastic",
    "Committed",
    "Energetic",
    "Perseverance",
    "Initiative",
    "Drive for excellence",
    "Inspired by challenge",
    "Reward-oriented",
  ],
};

export const valueSeeder = async () => {
  try {
    const validTypes = Object.values(VALUE_TYPE_ENUM);
    const { deletedCount } = await Value.deleteMany({ type: { $nin: validTypes } });
    logger.info(`Removed ${deletedCount} value(s) with deprecated types.`);

    const values: ValueInput[] = Object.entries(labelsByType).flatMap(([type, labels]) =>
      labels.map((label) => ({ type: type as VALUE_TYPE_ENUM, label }))
    );

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
