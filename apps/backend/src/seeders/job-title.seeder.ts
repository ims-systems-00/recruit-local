import { JobTitle, JobTitleInput } from "../models";
import { logger } from "../common/helper/logger";

const checkIfJobTitleExists = async (name: string) => {
  return JobTitle.findOne({ name });
};

const createJobTitle = async (jobTitle: JobTitleInput) => {
  const newJobTitle = new JobTitle(jobTitle);
  return newJobTitle.save();
};

export const jobTitleSeeder = async () => {
  try {
    const jobTitles: JobTitleInput[] = [
      // Engineering
      { name: "Software Engineer" },
      { name: "Senior Software Engineer" },
      { name: "Lead Software Engineer" },
      { name: "Principal Software Engineer" },
      { name: "Staff Software Engineer" },
      { name: "Frontend Developer" },
      { name: "Backend Developer" },
      { name: "Full Stack Developer" },
      { name: "Mobile Developer" },
      { name: "iOS Developer" },
      { name: "Android Developer" },
      { name: "DevOps Engineer" },
      { name: "Site Reliability Engineer" },
      { name: "Platform Engineer" },
      { name: "Data Engineer" },
      { name: "Machine Learning Engineer" },
      { name: "AI Engineer" },
      { name: "Security Engineer" },
      { name: "QA Engineer" },
      { name: "Engineering Manager" },
      { name: "VP of Engineering" },
      { name: "CTO" },

      // Product & Design
      { name: "Product Manager" },
      { name: "Senior Product Manager" },
      { name: "Principal Product Manager" },
      { name: "VP of Product" },
      { name: "Chief Product Officer" },
      { name: "UX Designer" },
      { name: "UI Designer" },
      { name: "Product Designer" },
      { name: "UX Researcher" },
      { name: "Design Lead" },
      { name: "Head of Design" },

      // Data & Analytics
      { name: "Data Analyst" },
      { name: "Senior Data Analyst" },
      { name: "Data Scientist" },
      { name: "Senior Data Scientist" },
      { name: "Business Intelligence Analyst" },
      { name: "Analytics Engineer" },
      { name: "Head of Data" },

      // Marketing
      { name: "Marketing Manager" },
      { name: "Digital Marketing Manager" },
      { name: "Content Manager" },
      { name: "SEO Specialist" },
      { name: "Growth Manager" },
      { name: "Brand Manager" },
      { name: "Social Media Manager" },
      { name: "Head of Marketing" },
      { name: "VP of Marketing" },
      { name: "CMO" },

      // Sales
      { name: "Sales Representative" },
      { name: "Account Executive" },
      { name: "Senior Account Executive" },
      { name: "Business Development Manager" },
      { name: "Sales Manager" },
      { name: "VP of Sales" },
      { name: "Chief Revenue Officer" },

      // Operations
      { name: "Operations Manager" },
      { name: "Project Manager" },
      { name: "Program Manager" },
      { name: "Scrum Master" },
      { name: "Chief Operating Officer" },

      // Finance
      { name: "Financial Analyst" },
      { name: "Accountant" },
      { name: "Finance Manager" },
      { name: "CFO" },

      // Human Resources
      { name: "HR Manager" },
      { name: "People Operations Manager" },
      { name: "Talent Acquisition Specialist" },
      { name: "Recruiter" },
      { name: "Head of HR" },
      { name: "Chief People Officer" },

      // Customer Success
      { name: "Customer Success Manager" },
      { name: "Customer Support Specialist" },
      { name: "Head of Customer Success" },

      // Leadership
      { name: "CEO" },
      { name: "Co-Founder" },
      { name: "Founder" },
      { name: "General Manager" },
      { name: "Director" },
      { name: "Head of" },
    ];

    await Promise.all(
      jobTitles.map(async (jobTitleData) => {
        const existing = await checkIfJobTitleExists(jobTitleData.name);
        if (!existing) {
          await createJobTitle(jobTitleData);
        }
      })
    );

    logger.info("Job title seeding completed.");
  } catch (error) {
    logger.error("Error seeding job titles", error);
  }
};
