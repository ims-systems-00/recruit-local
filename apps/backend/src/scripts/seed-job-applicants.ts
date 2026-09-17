import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { ACCOUNT_TYPE_ENUMS, JOB_PROFILE_STATUS_ENUM, ONBOARDING_STEP_ENUMS, VISIBILITY } from "@rl/types";
import { connectDB } from "../.config/database";
import { ExperienceLevel, Industry, Job, JobProfile, JobTitle, User, Value, WorkMode } from "../models";
import { EMAIL_VERIFICATION_STATUS_ENUMS } from "../models/constants";
import * as userService from "../v1/modules/user/user.service";
import * as jobProfileService from "../v1/modules/job-profile/job-profile.service";
import * as applicationService from "../v1/modules/application/application.service";
import * as jobService from "../v1/modules/job/job.service";
import { withTransaction } from "../common/helper/database-transaction";
import { enqueueApplicationRanking } from "../queue/applicationRankingQueue";
import { logger } from "../common/helper/logger";

/**
 * Dev-only: create N candidate accounts (verified, onboarded, with a job profile)
 * and apply each one to a job through the same service calls the API uses, so the
 * application gets its board status, reference, job stats bump and ranking job.
 * Idempotent on email — re-running reuses existing candidates and skips existing
 * applications. Run with:
 *   pnpm --filter backend seed:applicants:dev -- <jobId> [count]
 */
const PASSWORD = "Password@123";

const FIRST_NAMES = [
  "Aisha", "Ben", "Chloe", "Daniel", "Ella", "Farhan", "Grace", "Hassan", "Isla", "Jack",
  "Kavya", "Liam", "Maya", "Noah", "Olivia", "Priya", "Quinn", "Rahul", "Sofia", "Tom",
  "Uma", "Victor", "Wei", "Xander", "Yusuf", "Zara", "Arjun", "Beatrice", "Callum", "Dina",
];
const LAST_NAMES = [
  "Khan", "Smith", "Patel", "Jones", "Chen", "Williams", "Ahmed", "Brown", "Singh", "Taylor",
  "Nguyen", "Davies", "Rahman", "Evans", "Kim", "Wilson", "Hussain", "Thomas", "Garcia", "Roberts",
];
const CITIES = ["Reading", "London", "Oxford", "Bristol", "Manchester", "Cambridge", "Birmingham", "Leeds"];
const TITLE_POOL = ["Machine Learning Engineer", "AI Engineer", "Data Scientist", "Senior Data Scientist", "Data Engineer"];
const LEVEL_POOL = ["Intermediate", "Specialist", "Expert", "Lead"];
const SKILL_POOL = [
  "Python", "PyTorch", "TensorFlow", "scikit-learn", "MLOps", "Kubernetes", "Docker", "SQL", "Spark",
  "Airflow", "embeddings", "semantic search", "recommendation systems", "model monitoring", "FastAPI",
];

const pick = <T>(arr: T[], i: number): T => arr[i % arr.length];
const sample = <T>(arr: T[], n: number): T[] => [...arr].sort(() => Math.random() - 0.5).slice(0, n);
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const seedApplicants = async () => {
  const [jobId, countArg] = process.argv.slice(2);
  const count = Number(countArg ?? 50);
  if (!jobId || !mongoose.isValidObjectId(jobId)) throw new Error("Usage: seed-job-applicants <jobId> [count]");

  try {
    await connectDB();
    logger.info(`Connected to ${process.env.NODE_ENV} database`);

    const job = await Job.findById(jobId).lean();
    if (!job) throw new Error(`Job ${jobId} not found`);
    logger.info(`Seeding ${count} applicants for "${job.title}" (${job.status})`);

    const [titles, levels, industries, workModes, values] = await Promise.all([
      JobTitle.find({ name: { $in: TITLE_POOL } }).lean(),
      ExperienceLevel.find({ name: { $in: LEVEL_POOL } }).lean(),
      Industry.find({}).limit(30).lean(),
      WorkMode.find({}).lean(),
      Value.find({}).lean(),
    ]);

    let created = 0;
    let applied = 0;

    for (let i = 0; i < count; i++) {
      const firstName = pick(FIRST_NAMES, i);
      const lastName = pick(LAST_NAMES, i * 7 + 3);
      const email = `ml.candidate${String(i + 1).padStart(2, "0")}@example.com`;

      let user = await User.findOne({ email });
      if (!user) {
        user = await userService.create({
          payload: {
            firstName,
            lastName,
            email,
            password: PASSWORD,
            type: ACCOUNT_TYPE_ENUMS.CANDIDATE,
            emailVerificationStatus: EMAIL_VERIFICATION_STATUS_ENUMS.VERIFIED,
          } as any,
        });
        created++;
      }

      let jobProfileId = user.jobProfileId;
      if (!jobProfileId || !(await JobProfile.exists({ _id: jobProfileId }))) {
        const skills = sample(SKILL_POOL, randInt(4, 8));
        const jobProfile = await jobProfileService.create({
          payload: {
            userId: user._id,
            name: `${firstName} ${lastName}`,
            email,
            address: `${pick(CITIES, i)}, United Kingdom`,
            contactNumber: `+44 7700 9${String(randInt(0, 99999)).padStart(5, "0")}`,
            summary: `Machine learning practitioner with ${randInt(1, 12)} years building ${skills
              .slice(0, 3)
              .join(", ")} systems in production.`,
            skills: skills.join(", "),
            jobTitle: sample(titles, randInt(1, 3)).map((t) => t._id),
            experienceLevel: pick(levels, i)?._id,
            industry: sample(industries, 2).map((d) => d._id),
            workMode: sample(workModes, randInt(1, 2)).map((w) => w._id),
            values: sample(values, 10).map((v) => v._id),
            visibility: VISIBILITY.PUBLIC,
            status: JOB_PROFILE_STATUS_ENUM.UNVERIFIED,
            onboardingStep: ONBOARDING_STEP_ENUMS.COMPLETED,
          } as any,
        });
        jobProfileId = jobProfile._id as mongoose.Types.ObjectId;
        await userService.update({ query: { _id: user._id } as any, payload: { jobProfileId } as any });
      }

      let applicationId: unknown;
      try {
        await withTransaction(async (session) => {
          const application = await applicationService.create({
            payload: {
              jobId: job._id,
              jobProfileId,
              coverLetter: `I'm excited to apply for the ${job.title} role — I'd bring hands-on production ML experience.`,
              currentSalary: randInt(55, 95) * 1000,
              expectedSalary: randInt(80, 120) * 1000,
            } as any,
            session,
          });
          applicationId = application._id;
          await jobService.incrementStats({
            query: { _id: job._id.toString() } as any,
            payload: { totalApplications: 1 },
            session,
          });
        });
        await enqueueApplicationRanking(applicationId).catch((err: unknown) =>
          logger.error(`Failed to enqueue ranking for ${String(applicationId)}: ${String(err)}`)
        );
        applied++;
      } catch (err) {
        logger.warn(`${email}: ${(err as Error).message}`);
      }
    }

    logger.info(`Done. Candidates created: ${created}, applications created: ${applied}. Password: ${PASSWORD}`);
  } catch (error) {
    logger.error("Seeding applicants failed", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedApplicants();
