import mongoose, { Types } from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import {
  JOBS_STATUS_ENUMS,
  JOB_SKILLS_MAX,
  JOB_SKILL_LEVEL_ENUMS,
  JOB_SKILL_REQUIREMENT_ENUMS,
  JOB_VALUES_MAX_PER_TYPE,
  JOB_VALUE_PRIORITY_ENUMS,
} from "@rl/types";
import { connectDB } from "../.config/database";
import { Job, SkillCatalog, Value } from "../models";
import { recomputeJobKeywords } from "../v1/modules/job/keyword.service";
import { logger } from "../common/helper/logger";

/**
 * Dev-only: give open jobs that predate the skills and values steps a set of
 * catalogue skills and values that fit the job, so job matching has something
 * to compare.
 *
 * Each title is matched against `PROFILES` (first match wins) for its skills,
 * and the profile's family gives its values. Seniority read off the title sets
 * the skill levels and adds leadership values. Only an empty `skills` or
 * `values` is filled — a job an employer already set up keeps what it has — so
 * re-running is safe. Every name is resolved against the live catalogues before
 * anything is written, and a title no profile matches is reported and skipped.
 *
 * Dry run by default; pass --write to save. Run with:
 *   pnpm --filter @rl/backend exec env-cmd -f .env.dev ts-node src/scripts/seed-job-skills-values.ts [--write]
 */

type Family =
  | "engineering"
  | "data"
  | "design"
  | "product"
  | "marketing"
  | "sales"
  | "support"
  | "finance"
  | "legal"
  | "people"
  | "admin"
  | "logistics"
  | "hospitality"
  | "retail"
  | "healthcare"
  | "publicSector"
  | "charity"
  | "science"
  | "trades";

interface Profile {
  title: RegExp;
  family: Family;
  required: string[];
  preferred: string[];
}

/** Value labels per family, most important first — the order sets the priority tiers. */
const FAMILY_VALUES: Record<Family, string[]> = {
  engineering: [
    "Problem solver",
    "Quality-focused",
    "Continuous improvement",
    "Ownership of outcomes",
    "Psychological safety",
    "Self-motivated",
  ],
  data: ["Curious", "Detail-oriented", "Problem solver", "Integrity", "Impact-focused", "Methodical"],
  design: ["Creative", "Empathy", "Quality-focused", "Curious", "Passionate", "Open-minded"],
  product: [
    "Strategic thinking",
    "Decision-making",
    "Comfortable with ambiguity",
    "Empathy",
    "Impact-focused",
    "Prioritisation",
  ],
  marketing: ["Creative", "Results-driven", "Curious", "Goal-oriented", "Adaptable", "Transparency"],
  sales: ["Driven", "Resilient", "Goal-oriented", "Results-driven", "Honesty", "Self-starter"],
  support: ["Empathy", "Reliable", "Problem solver", "Respect", "Committed", "Emotional intelligence"],
  finance: ["Detail-oriented", "Integrity", "Methodical", "Trustworthy", "Deadline-driven", "Accountable"],
  legal: ["Integrity", "Principled", "Detail-oriented", "Methodical", "Trustworthy", "Transparency"],
  people: ["Empathy", "Fairness", "Inclusive", "Developing others", "Trustworthy", "Emotional intelligence"],
  admin: ["Detail-oriented", "Reliable", "Prioritisation", "Proactive", "Respect", "Time management"],
  logistics: ["Reliable", "Efficient", "Hands-on", "Accountability", "Committed", "Disciplined"],
  hospitality: ["Energetic", "Respect", "Fast-paced", "Enthusiastic", "Reliable", "Adaptable"],
  retail: ["Enthusiastic", "Respect", "Fast-paced", "Flexible", "Goal-oriented", "Adaptable"],
  healthcare: ["Compassionate", "Empathy", "Reliable", "Integrity", "Purpose-driven", "Detail-oriented"],
  publicSector: ["Socially responsible", "Fairness", "Integrity", "Purpose-driven", "Resilient", "Methodical"],
  charity: [
    "Mission-aligned",
    "Community-oriented",
    "Compassionate",
    "Purpose-driven",
    "Proactive",
    "Inspiring others",
  ],
  science: ["Curious", "Methodical", "Integrity", "Detail-oriented", "Continuous improvement", "Socially responsible"],
  trades: ["Hands-on", "Reliable", "Accountability", "Quality-focused", "Disciplined", "Problem solver"],
};

/** Added for senior roles, after the family's own values. */
const SENIOR_VALUES = ["Leading by example", "Developing others"];

/** Job title -> skills. Ordered: the first matching title wins, so narrower patterns come first. */
const PROFILES: Profile[] = [
  // Engineering
  {
    title: /frontend/i,
    family: "engineering",
    required: ["React", "JavaScript", "TypeScript"],
    preferred: ["Git", "REST APIs", "Figma"],
  },
  {
    title: /backend/i,
    family: "engineering",
    required: ["Node.js", "TypeScript", "REST APIs", "SQL"],
    preferred: ["Docker", "Git", "AWS"],
  },
  {
    title: /full stack/i,
    family: "engineering",
    required: ["React", "Node.js", "TypeScript", "REST APIs"],
    preferred: ["SQL", "Docker", "Git", "AWS"],
  },
  {
    title: /mobile/i,
    family: "engineering",
    required: ["React", "JavaScript", "TypeScript"],
    preferred: ["REST APIs", "Git", "Java"],
  },
  {
    title: /devops/i,
    family: "engineering",
    required: ["Docker", "AWS", "Git"],
    preferred: ["Python", "IT support"],
  },
  {
    title: /\bqa\b/i,
    family: "engineering",
    required: ["Software testing", "Agile methodologies"],
    preferred: ["JavaScript", "REST APIs", "SQL"],
  },
  {
    title: /security engineer/i,
    family: "engineering",
    required: ["Risk assessment", "AWS", "Python"],
    preferred: ["Docker", "Git"],
  },
  {
    title: /technical support/i,
    family: "support",
    required: ["IT support", "Customer service", "Complaint handling"],
    preferred: ["SQL", "REST APIs"],
  },

  // Data & AI
  {
    title: /prompt engineer/i,
    family: "data",
    required: ["Python", "Machine learning", "Copywriting"],
    preferred: ["REST APIs", "Data analysis"],
  },
  {
    title: /machine learning/i,
    family: "data",
    required: ["Python", "Machine learning", "SQL"],
    preferred: ["Docker", "AWS", "Git"],
  },
  {
    title: /data scientist/i,
    family: "data",
    required: ["Python", "Machine learning", "SQL", "Data analysis"],
    preferred: ["Data visualisation"],
  },
  {
    title: /data engineer/i,
    family: "data",
    required: ["SQL", "Python", "AWS"],
    preferred: ["Docker", "Git"],
  },
  {
    title: /analytics engineer/i,
    family: "data",
    required: ["SQL", "Python", "Data analysis"],
    preferred: ["Git", "Data visualisation"],
  },
  {
    title: /business intelligence/i,
    family: "data",
    required: ["SQL", "Power BI", "Data visualisation"],
    preferred: ["Tableau", "Microsoft Excel"],
  },
  {
    title: /data analyst/i,
    family: "data",
    required: ["SQL", "Microsoft Excel", "Data analysis"],
    preferred: ["Data visualisation", "Power BI", "Python"],
  },
  {
    title: /supply chain/i,
    family: "data",
    required: ["Data analysis", "Microsoft Excel", "Inventory management"],
    preferred: ["SQL", "Power BI"],
  },

  // Design
  {
    title: /graphic designer/i,
    family: "design",
    required: ["Graphic design", "Adobe Creative Suite"],
    preferred: ["Figma", "Copywriting"],
  },
  {
    title: /design system|ui designer|product designer/i,
    family: "design",
    required: ["Figma", "UX research", "Graphic design"],
    preferred: ["Adobe Creative Suite", "Agile methodologies"],
  },
  {
    title: /ux research/i,
    family: "design",
    required: ["UX research", "Data analysis", "Report writing"],
    preferred: ["Figma", "Stakeholder management"],
  },
  {
    title: /motion designer|video editor/i,
    family: "design",
    required: ["Adobe Creative Suite", "Graphic design"],
    preferred: ["Social media marketing", "Copywriting"],
  },
  {
    title: /photographer/i,
    family: "design",
    required: ["Adobe Creative Suite"],
    preferred: ["Social media marketing", "Customer service"],
  },

  // Product
  {
    title: /product (manager|owner)|program manager/i,
    family: "product",
    required: ["Agile methodologies", "Stakeholder management", "Project management"],
    preferred: ["Data analysis", "UX research"],
  },

  // Marketing
  {
    title: /head of marketing/i,
    family: "marketing",
    required: ["Budgeting", "People management", "Stakeholder management"],
    preferred: ["Google Analytics", "Social media marketing", "SEO"],
  },
  {
    title: /performance marketing/i,
    family: "marketing",
    required: ["Google Analytics", "Data analysis", "Social media marketing"],
    preferred: ["Budgeting", "SEO"],
  },
  {
    title: /email|lifecycle/i,
    family: "marketing",
    required: ["Email marketing", "HubSpot", "Copywriting"],
    preferred: ["Google Analytics", "Data analysis"],
  },
  {
    title: /seo/i,
    family: "marketing",
    required: ["SEO", "Google Analytics", "Copywriting"],
    preferred: ["Data analysis"],
  },
  {
    title: /social media/i,
    family: "marketing",
    required: ["Social media marketing", "Copywriting"],
    preferred: ["Google Analytics", "Adobe Creative Suite"],
  },
  {
    title: /content|copywriter/i,
    family: "marketing",
    required: ["Copywriting", "SEO"],
    preferred: ["Social media marketing", "Email marketing", "Google Analytics"],
  },
  {
    title: /digital marketing|marketing intern/i,
    family: "marketing",
    required: ["Social media marketing", "Copywriting"],
    preferred: ["SEO", "Email marketing", "Google Analytics"],
  },

  // Sales
  {
    title: /customer success|partnerships/i,
    family: "sales",
    required: ["Account management", "Stakeholder management", "Negotiation"],
    preferred: ["Salesforce", "HubSpot"],
  },
  {
    title: /account executive|sales executive|sales development/i,
    family: "sales",
    required: ["B2B sales", "Lead generation", "Negotiation"],
    preferred: ["Salesforce", "Account management", "HubSpot"],
  },

  // Customer support
  {
    title: /support team lead/i,
    family: "support",
    required: ["Customer service", "Complaint handling", "People management"],
    preferred: ["Coaching and mentoring", "Training delivery"],
  },
  {
    title: /support (specialist|advisor)/i,
    family: "support",
    required: ["Customer service", "Complaint handling", "Call handling"],
    preferred: ["Data entry", "IT support"],
  },

  // Finance
  {
    title: /finance director/i,
    family: "finance",
    required: ["Financial reporting", "Budgeting", "Financial analysis", "Stakeholder management"],
    preferred: ["People management"],
  },
  {
    title: /financial analyst/i,
    family: "finance",
    required: ["Financial analysis", "Microsoft Excel", "Financial reporting"],
    preferred: ["Budgeting", "Power BI"],
  },
  {
    title: /accountant/i,
    family: "finance",
    required: ["Financial reporting", "Budgeting", "Microsoft Excel"],
    preferred: ["Financial analysis", "Xero"],
  },
  {
    title: /bookkeeper/i,
    family: "finance",
    required: ["Bookkeeping", "Xero", "Accounts payable", "Accounts receivable"],
    preferred: ["Microsoft Excel"],
  },
  {
    title: /accounts payable/i,
    family: "finance",
    required: ["Accounts payable", "Invoicing", "Microsoft Excel"],
    preferred: ["Xero", "Data entry"],
  },
  {
    title: /payroll/i,
    family: "finance",
    required: ["Payroll", "Microsoft Excel", "Data entry"],
    preferred: ["Xero"],
  },

  // Legal
  {
    title: /counsel/i,
    family: "legal",
    required: ["Employment law", "Negotiation", "Report writing"],
    preferred: ["Risk assessment", "Stakeholder management"],
  },
  {
    title: /paralegal/i,
    family: "legal",
    required: ["Report writing", "Microsoft Word", "Diary management"],
    preferred: ["Employment law", "Data entry"],
  },
  {
    title: /data protection/i,
    family: "legal",
    required: ["Risk assessment", "Report writing", "Training delivery"],
    preferred: ["Stakeholder management", "IT support"],
  },

  // People / HR
  {
    title: /hr business partner/i,
    family: "people",
    required: ["Employee relations", "Employment law", "Stakeholder management"],
    preferred: ["Coaching and mentoring", "People management"],
  },
  {
    title: /hr administrator/i,
    family: "people",
    required: ["Onboarding", "Data entry", "Microsoft Excel"],
    preferred: ["Employee relations", "Payroll"],
  },
  {
    title: /recruitment|talent acquisition/i,
    family: "people",
    required: ["Recruitment", "Stakeholder management", "Negotiation"],
    preferred: ["Onboarding"],
  },
  {
    title: /learning & development/i,
    family: "people",
    required: ["Training delivery", "Coaching and mentoring", "Public speaking"],
    preferred: ["Stakeholder management", "Project management"],
  },

  // Administration
  {
    title: /executive assistant/i,
    family: "admin",
    required: ["Diary management", "Minute taking", "Google Workspace"],
    preferred: ["Microsoft Word", "Stakeholder management"],
  },
  {
    title: /office manager/i,
    family: "admin",
    required: ["Diary management", "Budgeting", "People management"],
    preferred: ["Google Workspace", "Health and safety compliance"],
  },
  {
    title: /data entry/i,
    family: "admin",
    required: ["Data entry", "Microsoft Excel"],
    preferred: ["Google Workspace"],
  },
  {
    title: /project coordinator/i,
    family: "admin",
    required: ["Project management", "Microsoft Excel", "Minute taking"],
    preferred: ["Stakeholder management", "Agile methodologies"],
  },

  // Logistics
  {
    title: /hgv/i,
    family: "logistics",
    required: ["Delivery driving", "Health and safety compliance", "Manual handling"],
    preferred: ["Risk assessment"],
  },
  {
    title: /delivery driver/i,
    family: "logistics",
    required: ["Delivery driving", "Customer service"],
    preferred: ["Manual handling", "Health and safety compliance"],
  },
  {
    title: /forklift/i,
    family: "logistics",
    required: ["Forklift operation", "Manual handling", "Health and safety compliance"],
    preferred: ["Picking and packing"],
  },
  {
    title: /warehouse supervisor/i,
    family: "logistics",
    required: ["Inventory management", "People management", "Health and safety compliance"],
    preferred: ["Picking and packing", "Forklift operation"],
  },
  {
    title: /warehouse operative/i,
    family: "logistics",
    required: ["Picking and packing", "Manual handling", "Inventory management"],
    preferred: ["Forklift operation", "Health and safety compliance"],
  },
  {
    title: /operations manager/i,
    family: "logistics",
    required: ["People management", "Inventory management", "Budgeting"],
    preferred: ["Health and safety compliance", "Project management"],
  },

  // Hospitality
  {
    title: /barista/i,
    family: "hospitality",
    required: ["Barista", "Customer service", "Food hygiene"],
    preferred: ["Cash handling", "Point of sale (POS) systems"],
  },
  {
    title: /chef/i,
    family: "hospitality",
    required: ["Food preparation", "Food hygiene", "Health and safety compliance"],
    preferred: ["Inventory management"],
  },
  {
    title: /receptionist/i,
    family: "hospitality",
    required: ["Customer service", "Call handling", "Complaint handling"],
    preferred: ["Point of sale (POS) systems", "Cash handling"],
  },
  {
    title: /restaurant/i,
    family: "hospitality",
    required: ["People management", "Customer service", "Food hygiene", "Budgeting"],
    preferred: ["Inventory management"],
  },

  // Retail
  {
    title: /store manager/i,
    family: "retail",
    required: ["People management", "Customer service", "Visual merchandising"],
    preferred: ["Inventory management", "Budgeting"],
  },
  {
    title: /sales assistant/i,
    family: "retail",
    required: ["Customer service", "Cash handling", "Point of sale (POS) systems"],
    preferred: ["Visual merchandising"],
  },

  // Healthcare
  {
    title: /nurse/i,
    family: "healthcare",
    required: ["Patient assessment", "Medication administration", "Vital signs monitoring", "Wound care"],
    preferred: ["Infection prevention and control", "Basic life support"],
  },
  {
    title: /care assistant|healthcare assistant/i,
    family: "healthcare",
    required: ["Personal care", "Safeguarding adults", "Care record keeping"],
    preferred: ["Medication administration", "Dementia care", "Manual handling"],
  },
  {
    title: /pharmacist/i,
    family: "healthcare",
    required: ["Medication administration", "Patient assessment"],
    preferred: ["Customer service", "Report writing"],
  },
  {
    title: /physiotherapist/i,
    family: "healthcare",
    required: ["Patient assessment", "Mobility support", "Care planning"],
    preferred: ["Report writing"],
  },

  // Public sector & charity
  {
    title: /social worker/i,
    family: "publicSector",
    required: ["Safeguarding children", "Care planning", "Report writing", "Risk assessment"],
    preferred: ["Mental health support"],
  },
  {
    title: /policy/i,
    family: "publicSector",
    required: ["Report writing", "Stakeholder management", "Data analysis"],
    preferred: ["Public speaking"],
  },
  {
    title: /fundraising/i,
    family: "charity",
    required: ["Stakeholder management", "Public speaking", "Budgeting"],
    preferred: ["Email marketing", "Lead generation"],
  },
  {
    title: /volunteer/i,
    family: "charity",
    required: ["Onboarding", "Training delivery", "Safeguarding adults"],
    preferred: ["Stakeholder management", "Diary management"],
  },

  // Science
  {
    title: /laboratory/i,
    family: "science",
    required: ["Health and safety compliance", "Data entry", "Report writing"],
    preferred: ["Risk assessment", "Microsoft Excel"],
  },
  {
    title: /research scientist/i,
    family: "science",
    required: ["Data analysis", "Report writing", "Health and safety compliance"],
    preferred: ["Python", "Risk assessment"],
  },
  {
    title: /environmental/i,
    family: "science",
    required: ["Risk assessment", "Report writing", "Data analysis"],
    preferred: ["Stakeholder management"],
  },
  {
    title: /sustainability/i,
    family: "science",
    required: ["Stakeholder management", "Report writing", "Project management"],
    preferred: ["Data analysis", "Budgeting"],
  },

  // Construction & trades
  {
    title: /electrician/i,
    family: "trades",
    required: ["Electrical installation", "Health and safety compliance", "Working at height"],
    preferred: ["Power tools", "Risk assessment"],
  },
  {
    title: /plumbing/i,
    family: "trades",
    required: ["Plumbing", "Health and safety compliance", "Power tools"],
    preferred: ["Risk assessment", "Working at height"],
  },
  {
    title: /labourer/i,
    family: "trades",
    required: ["Manual handling", "Power tools", "Health and safety compliance"],
    preferred: ["Working at height"],
  },
  {
    title: /architectural/i,
    family: "trades",
    required: ["Project management", "Risk assessment", "Health and safety compliance"],
    preferred: ["Report writing", "Stakeholder management"],
  },
];

type Seniority = "junior" | "mid" | "senior";

const SENIOR_TITLE = /\b(senior|lead|head|director|principal|manager|supervisor)\b/i;
const JUNIOR_TITLE = /\b(junior|graduate|intern|trainee|assistant|temp|temporary)\b/i;

const seniorityOf = (title: string): Seniority =>
  SENIOR_TITLE.test(title) ? "senior" : JUNIOR_TITLE.test(title) ? "junior" : "mid";

const { WILLING_TO_LEARN, BEGINNER, INTERMEDIATE, ADVANCED } = JOB_SKILL_LEVEL_ENUMS;

/** The level asked for, by seniority, for required and then preferred skills. */
const LEVELS: Record<Seniority, [JOB_SKILL_LEVEL_ENUMS, JOB_SKILL_LEVEL_ENUMS]> = {
  junior: [BEGINNER, WILLING_TO_LEARN],
  mid: [INTERMEDIATE, BEGINNER],
  senior: [ADVANCED, INTERMEDIATE],
};

const { ESSENTIAL, HIGHLY_IMPORTANT, IMPORTANT, DESIRABLE } = JOB_VALUE_PRIORITY_ENUMS;

/** Priority by position in a job's value list; anything further down is desirable. */
const PRIORITY_ORDER = [ESSENTIAL, ESSENTIAL, HIGHLY_IMPORTANT, HIGHLY_IMPORTANT, IMPORTANT, IMPORTANT];

interface CatalogueValue {
  _id: Types.ObjectId;
  type: string;
}

/** Resolves names against the live catalogues, failing on any that are missing or ambiguous. */
const loadCatalogues = async () => {
  const live = { isActive: { $ne: false }, "deleteMarker.status": { $ne: true } };
  const [skills, values] = await Promise.all([
    SkillCatalog.find(live).select("name").lean(),
    Value.find(live).select("label type").lean(),
  ]);

  const skillByName = new Map(skills.map((skill) => [skill.name as string, skill._id as Types.ObjectId]));
  const valuesByLabel = new Map<string, CatalogueValue[]>();
  for (const value of values) {
    const label = value.label as string;
    valuesByLabel.set(label, [
      ...(valuesByLabel.get(label) ?? []),
      { _id: value._id as Types.ObjectId, type: value.type },
    ]);
  }

  const skillId = (name: string) => {
    const id = skillByName.get(name);
    if (!id) throw new Error(`Skill "${name}" is not in the skill catalogue`);
    return id;
  };
  const value = (label: string) => {
    const matches = valuesByLabel.get(label) ?? [];
    if (matches.length !== 1) {
      throw new Error(`Value "${label}" matches ${matches.length} catalogue entries; it must match exactly one`);
    }
    return matches[0];
  };

  return { skillId, value };
};

const seedJobSkillsValues = async () => {
  const write = process.argv.includes("--write");

  try {
    await connectDB();
    logger.info(`Connected to ${process.env.NODE_ENV} database${write ? "" : " (dry run, pass --write to save)"}`);

    const { skillId, value } = await loadCatalogues();

    const empty = (field: string) => ({ $or: [{ [field]: { $exists: false } }, { [field]: { $size: 0 } }] });
    const jobs = await Job.find({
      status: JOBS_STATUS_ENUMS.OPEN,
      "deleteMarker.status": { $ne: true },
      $or: [empty("skills"), empty("values")],
    })
      .select("title skills values")
      .sort({ title: 1 })
      .lean();

    const plan: { id: string; title: string; set: Record<string, unknown>; summary: string }[] = [];
    const unmatched: string[] = [];

    // Resolve everything first, so a bad name fails the run before any write.
    for (const job of jobs) {
      const title = job.title ?? "";
      const profile = PROFILES.find((candidate) => candidate.title.test(title));
      if (!profile) {
        unmatched.push(title);
        continue;
      }

      const seniority = seniorityOf(title);
      const [requiredLevel, preferredLevel] = LEVELS[seniority];
      const set: Record<string, unknown> = {};
      const notes: string[] = [];

      if (!job.skills?.length) {
        const skills = [
          ...profile.required.map((name) => ({
            name,
            level: requiredLevel,
            requirement: JOB_SKILL_REQUIREMENT_ENUMS.REQUIRED,
          })),
          ...profile.preferred.map((name) => ({
            name,
            level: preferredLevel,
            requirement: JOB_SKILL_REQUIREMENT_ENUMS.PREFERRED,
          })),
        ].slice(0, JOB_SKILLS_MAX);
        set.skills = skills.map(({ name, level, requirement }) => ({ skill: skillId(name), level, requirement }));
        notes.push(
          `skills: ${skills.map(({ name, requirement }) => (requirement === "required" ? `${name}*` : name)).join(", ")}`
        );
      }

      if (!job.values?.length) {
        const labels = [...FAMILY_VALUES[profile.family]];
        if (seniority === "senior") labels.push(...SENIOR_VALUES.filter((label) => !labels.includes(label)));

        const perType = new Map<string, number>();
        const rows = labels.flatMap((label) => {
          const entry = value(label);
          const count = perType.get(entry.type) ?? 0;
          if (count >= JOB_VALUES_MAX_PER_TYPE) return [];
          perType.set(entry.type, count + 1);
          return [{ label, value: entry._id }];
        });

        set.values = rows.map(({ value: id }, index) => ({ value: id, priority: PRIORITY_ORDER[index] ?? DESIRABLE }));
        notes.push(`values: ${rows.map(({ label }) => label).join(", ")}`);
      }

      plan.push({ id: String(job._id), title, set, summary: `${title} (${seniority}) | ${notes.join(" | ")}` });
    }

    for (const { summary } of plan) logger.info(summary);
    logger.info(`${plan.length} of ${jobs.length} open jobs to fill (* = required skill)`);
    if (unmatched.length) logger.warn(`No profile for ${unmatched.length} titles, skipped: ${unmatched.join("; ")}`);

    if (!write) return;

    for (const { id, set } of plan) {
      await Job.updateOne({ _id: id }, { $set: set });
      // Skill names feed a job's match keywords, so recompute them as an edit would.
      await recomputeJobKeywords(id);
    }
    logger.info(`Filled ${plan.length} jobs.`);
  } catch (error) {
    logger.error("Seeding job skills and values failed", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
};

seedJobSkillsValues();
