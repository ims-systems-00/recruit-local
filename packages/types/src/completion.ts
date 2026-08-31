/**
 * Profile/organisation completion — shared config and response shapes.
 *
 * The section configs below are the single source of truth for what counts
 * toward a completion percentage and how much each part is worth. Both the
 * backend (to compute and store) and the frontend (to render the checklist)
 * read from the same arrays. Weights are tuned to sum to 100.
 *
 * Scoring is per FIELD, not per section: every field in a section carries an
 * equal share of that section's weight, so the percentage moves as soon as one
 * field is filled instead of waiting for the whole section.
 */

/** One scorable input inside a section. `key` must be unique within a config. */
export interface CompletionField {
  key: string;
  label: string;
}

/** A weighted section in a completion config. */
export interface CompletionSection {
  key: string;
  label: string;
  weight: number;
  fields: CompletionField[];
}

/** A section enriched with what it scored (response shape). */
export interface CompletionSectionResult extends CompletionSection {
  complete: boolean;
  /** Points earned, out of `weight`. */
  earned: number;
  missingFields: CompletionField[];
}

/** The full completion breakdown returned to clients. */
export interface Completion {
  percentage: number;
  sections: CompletionSectionResult[];
  /** Keys of sections that are not yet fully complete. */
  missing: string[];
  /** Every unfilled field, flattened — what a "what's left" checklist renders. */
  missingFields: CompletionField[];
  computedAt: string | null;
}

/** The lean shape persisted on the JobProfile/Tenant document. */
export interface StoredCompletion {
  percentage: number;
  completeFields: string[];
  /** Derived from `completeFields`; kept so existing reads/queries still work. */
  completeSections: string[];
  computedAt?: Date | string | null;
}

/** Candidate job-profile sections (sum = 100). */
export const PROFILE_COMPLETION_SECTIONS: CompletionSection[] = [
  {
    key: "basics",
    label: "Basic details",
    weight: 15,
    fields: [
      { key: "name", label: "Full name" },
      { key: "email", label: "Email address" },
      { key: "contactNumber", label: "Contact number" },
      { key: "address", label: "Address" },
      { key: "summary", label: "Professional summary" },
    ],
  },
  {
    key: "career",
    label: "Career preferences",
    weight: 15,
    fields: [
      { key: "jobTitle", label: "Job titles" },
      { key: "profileIndustry", label: "Industries" },
      { key: "workMode", label: "Work mode" },
      { key: "experienceLevel", label: "Experience level" },
    ],
  },
  { key: "photo", label: "Profile photo", weight: 10, fields: [{ key: "profilePhoto", label: "Profile photo" }] },
  { key: "experience", label: "Work experience", weight: 15, fields: [{ key: "experience", label: "Work experience" }] },
  { key: "education", label: "Education", weight: 10, fields: [{ key: "education", label: "Education" }] },
  { key: "skills", label: "Skills", weight: 10, fields: [{ key: "skills", label: "Skills" }] },
  { key: "cv", label: "CV / résumé", weight: 10, fields: [{ key: "cv", label: "CV / résumé" }] },
  {
    key: "certifications",
    label: "Certifications",
    weight: 5,
    fields: [{ key: "certifications", label: "Certifications" }],
  },
  { key: "values", label: "Values", weight: 5, fields: [{ key: "profileValues", label: "Values" }] },
  { key: "languages", label: "Languages", weight: 5, fields: [{ key: "languages", label: "Languages" }] },
];

/** Employer/organisation (tenant) sections (sum = 100). */
export const TENANT_COMPLETION_SECTIONS: CompletionSection[] = [
  {
    key: "basics",
    label: "Organisation basics",
    weight: 15,
    fields: [
      { key: "name", label: "Organisation name" },
      { key: "description", label: "Description" },
      { key: "industry", label: "Industry" },
      { key: "type", label: "Organisation type" },
      { key: "size", label: "Number of employees" },
    ],
  },
  {
    key: "contact",
    label: "Contact details",
    weight: 15,
    fields: [
      { key: "phone", label: "Contact number" },
      { key: "email", label: "Contact email" },
      { key: "officeAddress", label: "Office address" },
    ],
  },
  { key: "branding", label: "Logo & branding", weight: 10, fields: [{ key: "logo", label: "Logo" }] },
  { key: "photo", label: "Profile photo", weight: 10, fields: [{ key: "profileImage", label: "Profile photo" }] },
  {
    key: "web",
    label: "Web presence",
    weight: 10,
    fields: [
      { key: "website", label: "Website" },
      { key: "linkedIn", label: "LinkedIn" },
    ],
  },
  {
    key: "missionVision",
    label: "Mission & vision",
    weight: 15,
    fields: [
      { key: "missionStatement", label: "Mission statement" },
      { key: "visionStatement", label: "Vision statement" },
    ],
  },
  {
    key: "offerings",
    label: "Products & services",
    weight: 15,
    fields: [
      { key: "coreProducts", label: "Core products" },
      { key: "coreServices", label: "Core services" },
    ],
  },
  { key: "values", label: "Values", weight: 10, fields: [{ key: "values", label: "Values" }] },
];
