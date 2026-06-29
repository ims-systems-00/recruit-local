import { Job } from "bullmq";
import { Salary } from "../models";
import { ReusableQueue } from "./Queue";

export interface SalaryUpdateJobData {
  jobId: string;
  title: string;
  salary: number;
  location?: string;
  yearOfExperience?: number;
}

const mapExperienceLevel = (years?: number): string => {
  if (years === undefined || years === null || years <= 2) return "Entry Level";
  if (years <= 5) return "Mid Level";
  return "Senior Level";
};

const processSalaryUpdate = async (job: Job<SalaryUpdateJobData>) => {
  const { title, salary, location, yearOfExperience } = job.data;
  const experienceLevel = mapExperienceLevel(yearOfExperience);

  await Salary.findOneAndUpdate(
    { jobTitle: title, location: location ?? "", experienceLevel },
    {
      $min: { minSalary: salary },
      $max: { maxSalary: salary },
      $setOnInsert: { currency: "USD" },
    },
    { upsert: true, new: true }
  );
};

export const salaryUpdateQueue = new ReusableQueue<SalaryUpdateJobData>("salary-update-queue", processSalaryUpdate);
