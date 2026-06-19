import { Industry, IndustryInput } from "../models";
import { logger } from "../common/helper/logger";

const checkIfIndustryExists = async (name: string) => {
  return Industry.findOne({ name });
};

const createIndustry = async (industry: IndustryInput) => {
  const newIndustry = new Industry(industry);
  return newIndustry.save();
};

export const industrySeeder = async () => {
  try {
    const industries: IndustryInput[] = [
      // Visible in screenshot
      { name: "Administration & Office Support" },
      { name: "Customer Service" },
      { name: "Sales" },
      { name: "Hospitality & Catering" },
      { name: "Education & Training" },
      { name: "Construction & Trades" },
      { name: "Human Resources (HR)" },
      { name: "IT & Technology" },
      { name: "Creative & Design" },

      // Additional industries
      { name: "Accounting & Finance" },
      { name: "Banking & Financial Services" },
      { name: "Marketing & Communications" },
      { name: "Legal" },
      { name: "Engineering" },
      { name: "Manufacturing & Operations" },
      { name: "Healthcare & Medical" },
      { name: "Nursing & Aged Care" },
      { name: "Science & Technology" },
      { name: "Retail & Consumer Products" },
      { name: "Transport & Logistics" },
      { name: "Mining, Resources & Energy" },
      { name: "Real Estate & Property" },
      { name: "Insurance & Superannuation" },
      { name: "Consulting & Strategy" },
      { name: "Government & Defence" },
      { name: "Not-for-Profit & Charity" },
      { name: "Social Work & Community Services" },
      { name: "Media & Entertainment" },
      { name: "Advertising & Public Relations" },
      { name: "Architecture & Interior Design" },
      { name: "Farming, Animals & Conservation" },
      { name: "Sport & Recreation" },
      { name: "Trades & Services" },
      { name: "Automotive" },
      { name: "Aviation & Aerospace" },
      { name: "Telecommunications" },
      { name: "Pharmaceuticals & Biotechnology" },
      { name: "E-Commerce" },
      { name: "Cybersecurity" },
      { name: "Data & Analytics" },
      { name: "Artificial Intelligence" },
      { name: "Supply Chain & Procurement" },
      { name: "Event Management" },
      { name: "Tourism & Travel" },
      { name: "Food & Beverage" },
    ];

    await Promise.all(
      industries.map(async (industryData) => {
        const existing = await checkIfIndustryExists(industryData.name);
        if (!existing) {
          await createIndustry(industryData);
        }
      })
    );

    logger.info("Industry seeding completed.");
  } catch (error) {
    logger.error("Error seeding industries", error);
  }
};
