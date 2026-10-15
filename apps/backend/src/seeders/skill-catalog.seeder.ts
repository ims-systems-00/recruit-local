import { SkillCatalog, SkillCatalogInput, normalizeSkillName } from "../models";
import { logger } from "../common/helper/logger";

// No delete filter on purpose: a skill an admin has deleted stays deleted
// instead of coming back as a new live entry on the next seed.
const checkIfSkillExists = async (name: string) => {
  return SkillCatalog.exists({ normalizedName: normalizeSkillName(name) });
};

const createSkill = async (skill: SkillCatalogInput) => {
  const newSkill = new SkillCatalog(skill);
  return newSkill.save();
};

export const skillCatalogSeeder = async () => {
  try {
    // Hard skills only — soft ones ("Time management", "Problem solver") are
    // values in the value catalogue, and a job lists those separately.
    const skills: SkillCatalogInput[] = [
      // Care & Support
      { name: "Personal care" },
      { name: "Medication administration" },
      { name: "Manual handling" },
      { name: "Safeguarding adults" },
      { name: "Safeguarding children" },
      { name: "Dementia care" },
      { name: "End-of-life care" },
      { name: "Infection prevention and control" },
      { name: "Care planning" },
      { name: "Mental health support" },
      { name: "Learning disability support" },
      { name: "Autism support" },
      { name: "Positive behaviour support" },
      { name: "Mobility support" },
      { name: "Nutrition and hydration" },
      { name: "Care record keeping" },
      { name: "Catheter care" },
      { name: "Stoma care" },
      { name: "Diabetes care" },
      { name: "Epilepsy awareness" },
      { name: "Wound care" },
      { name: "Vital signs monitoring" },
      { name: "Phlebotomy" },
      { name: "Patient assessment" },

      // Health & Safety
      { name: "First aid" },
      { name: "Basic life support" },
      { name: "Food hygiene" },
      { name: "Health and safety compliance" },
      { name: "Risk assessment" },
      { name: "Fire safety" },

      // Customer Service & Retail
      { name: "Customer service" },
      { name: "Complaint handling" },
      { name: "Call handling" },
      { name: "Cash handling" },
      { name: "Point of sale (POS) systems" },
      { name: "Visual merchandising" },

      // Hospitality
      { name: "Food preparation" },
      { name: "Barista" },
      { name: "Table service" },
      { name: "Housekeeping" },

      // Administration
      { name: "Data entry" },
      { name: "Microsoft Excel" },
      { name: "Microsoft Word" },
      { name: "Google Workspace" },
      { name: "Diary management" },
      { name: "Minute taking" },

      // Finance
      { name: "Bookkeeping" },
      { name: "Payroll" },
      { name: "Invoicing" },
      { name: "Accounts payable" },
      { name: "Accounts receivable" },
      { name: "Financial reporting" },
      { name: "Financial analysis" },
      { name: "Budgeting" },
      { name: "Xero" },

      // Sales & Marketing
      { name: "B2B sales" },
      { name: "Lead generation" },
      { name: "Negotiation" },
      { name: "Account management" },
      { name: "Salesforce" },
      { name: "HubSpot" },
      { name: "Social media marketing" },
      { name: "SEO" },
      { name: "Copywriting" },
      { name: "Email marketing" },
      { name: "Google Analytics" },

      // Software & IT
      { name: "JavaScript" },
      { name: "TypeScript" },
      { name: "Python" },
      { name: "Java" },
      { name: "SQL" },
      { name: "React" },
      { name: "Node.js" },
      { name: "REST APIs" },
      { name: "Git" },
      { name: "Docker" },
      { name: "AWS" },
      { name: "Software testing" },
      { name: "IT support" },
      { name: "Agile methodologies" },

      // Data
      { name: "Data analysis" },
      { name: "Data visualisation" },
      { name: "Power BI" },
      { name: "Tableau" },
      { name: "Machine learning" },

      // Design
      { name: "Figma" },
      { name: "UX research" },
      { name: "Graphic design" },
      { name: "Adobe Creative Suite" },

      // Human Resources
      { name: "Recruitment" },
      { name: "Onboarding" },
      { name: "Employee relations" },
      { name: "Employment law" },
      { name: "Training delivery" },

      // Logistics & Trades
      { name: "Forklift operation" },
      { name: "Picking and packing" },
      { name: "Inventory management" },
      { name: "Delivery driving" },
      { name: "Working at height" },
      { name: "Power tools" },
      { name: "Carpentry" },
      { name: "Plumbing" },
      { name: "Electrical installation" },
      { name: "Painting and decorating" },

      // Education
      { name: "Lesson planning" },
      { name: "Classroom management" },
      { name: "Special educational needs (SEN) support" },

      // Professional
      { name: "Project management" },
      { name: "People management" },
      { name: "Stakeholder management" },
      { name: "Coaching and mentoring" },
      { name: "Public speaking" },
      { name: "Report writing" },
    ];

    await Promise.all(
      skills.map(async (skillData) => {
        const existing = await checkIfSkillExists(skillData.name);
        if (!existing) {
          await createSkill(skillData);
        }
      })
    );

    logger.info("Skill catalogue seeding completed.");
  } catch (error) {
    logger.error("Error seeding the skill catalogue", error);
  }
};
