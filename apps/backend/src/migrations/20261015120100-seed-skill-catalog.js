/**
 * Fills the skill catalogue with its starting entries — the list a job's skills
 * are picked from. Seeders do not run in production, so this migration is how
 * every database, dev included, gets them. Later additions go through the
 * platform-admin `/skill-catalog` endpoints or a new migration; this list is a
 * one-time snapshot, not something to keep editing.
 *
 * Hard skills only — soft ones ("Time management", "Problem solver") are values
 * in the value catalogue, and a job lists those separately.
 *
 * Runs after 20261015120000-job-skills-values-indexes, so the unique
 * `normalizedName` index is already in place.
 *
 * Idempotent: an upsert per name that only inserts. The filter has no delete
 * condition on purpose, so an entry an admin has soft-deleted stays deleted
 * instead of coming back as a new live one.
 */
const SKILLS = [
  // Care & Support
  "Personal care",
  "Medication administration",
  "Manual handling",
  "Safeguarding adults",
  "Safeguarding children",
  "Dementia care",
  "End-of-life care",
  "Infection prevention and control",
  "Care planning",
  "Mental health support",
  "Learning disability support",
  "Autism support",
  "Positive behaviour support",
  "Mobility support",
  "Nutrition and hydration",
  "Care record keeping",
  "Catheter care",
  "Stoma care",
  "Diabetes care",
  "Epilepsy awareness",
  "Wound care",
  "Vital signs monitoring",
  "Phlebotomy",
  "Patient assessment",

  // Health & Safety
  "First aid",
  "Basic life support",
  "Food hygiene",
  "Health and safety compliance",
  "Risk assessment",
  "Fire safety",

  // Customer Service & Retail
  "Customer service",
  "Complaint handling",
  "Call handling",
  "Cash handling",
  "Point of sale (POS) systems",
  "Visual merchandising",

  // Hospitality
  "Food preparation",
  "Barista",
  "Table service",
  "Housekeeping",

  // Administration
  "Data entry",
  "Microsoft Excel",
  "Microsoft Word",
  "Google Workspace",
  "Diary management",
  "Minute taking",

  // Finance
  "Bookkeeping",
  "Payroll",
  "Invoicing",
  "Accounts payable",
  "Accounts receivable",
  "Financial reporting",
  "Financial analysis",
  "Budgeting",
  "Xero",

  // Sales & Marketing
  "B2B sales",
  "Lead generation",
  "Negotiation",
  "Account management",
  "Salesforce",
  "HubSpot",
  "Social media marketing",
  "SEO",
  "Copywriting",
  "Email marketing",
  "Google Analytics",

  // Software & IT
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "SQL",
  "React",
  "Node.js",
  "REST APIs",
  "Git",
  "Docker",
  "AWS",
  "Software testing",
  "IT support",
  "Agile methodologies",

  // Data
  "Data analysis",
  "Data visualisation",
  "Power BI",
  "Tableau",
  "Machine learning",

  // Design
  "Figma",
  "UX research",
  "Graphic design",
  "Adobe Creative Suite",

  // Human Resources
  "Recruitment",
  "Onboarding",
  "Employee relations",
  "Employment law",
  "Training delivery",

  // Logistics & Trades
  "Forklift operation",
  "Picking and packing",
  "Inventory management",
  "Delivery driving",
  "Working at height",
  "Power tools",
  "Carpentry",
  "Plumbing",
  "Electrical installation",
  "Painting and decorating",

  // Education
  "Lesson planning",
  "Classroom management",
  "Special educational needs (SEN) support",

  // Professional
  "Project management",
  "People management",
  "Stakeholder management",
  "Coaching and mentoring",
  "Public speaking",
  "Report writing",
];

// Must match `normalizeSkillName` in models/skill-catalog.model.ts: the unique
// index and the catalogue search both key on it. A migration is plain CommonJS
// and cannot import the TypeScript model, hence the copy.
const normalizeSkillName = (name) => name.trim().replace(/\s+/g, " ").toLowerCase();

module.exports = {
  async up(db) {
    const now = new Date();

    // Raw driver writes skip Mongoose, so each document carries what the model
    // would have set: the derived name, defaults, soft-delete marker, timestamps.
    await db.collection("skillcatalogs").bulkWrite(
      SKILLS.map((name) => ({
        updateOne: {
          filter: { normalizedName: normalizeSkillName(name) },
          update: {
            $setOnInsert: {
              name,
              normalizedName: normalizeSkillName(name),
              isActive: true,
              deleteMarker: { status: false, deletedAt: null, dateScheduled: null },
              createdAt: now,
              updatedAt: now,
              __v: 0,
            },
          },
          upsert: true,
        },
      })),
      { ordered: false }
    );
  },

  // Removes this list's entries, except any a job still uses — deleting those
  // would orphan the job's skill rows.
  async down(db) {
    const entries = await db
      .collection("skillcatalogs")
      .find({ normalizedName: { $in: SKILLS.map(normalizeSkillName) } }, { projection: { _id: 1 } })
      .toArray();

    const inUse = new Set(
      (
        await db.collection("jobs").distinct("skills.skill", { "skills.skill": { $in: entries.map(({ _id }) => _id) } })
      ).map(String)
    );

    await db
      .collection("skillcatalogs")
      .deleteMany({ _id: { $in: entries.filter(({ _id }) => !inUse.has(String(_id))).map(({ _id }) => _id) } });
  },
};
