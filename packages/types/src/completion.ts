/**
 * Profile/organisation completion — shared config and response shapes.
 *
 * The section configs below are the single source of truth for what counts
 * toward a completion percentage and how much each part is worth. Both the
 * backend (to compute and store) and the frontend (to render the checklist)
 * read from the same arrays. Weights are tuned to sum to 100.
 */

/** A weighted section in a completion config. */
export interface CompletionSection {
  key: string;
  label: string;
  weight: number;
}

/** A section enriched with whether it is currently complete (response shape). */
export interface CompletionSectionResult extends CompletionSection {
  complete: boolean;
}

/** The full completion breakdown returned to clients. */
export interface Completion {
  percentage: number;
  sections: CompletionSectionResult[];
  missing: string[];
  computedAt: string | null;
}

/** The lean shape persisted on the JobProfile/Tenant document. */
export interface StoredCompletion {
  percentage: number;
  completeSections: string[];
  computedAt?: Date | string | null;
}

/** Candidate job-profile sections (sum = 100). */
export const PROFILE_COMPLETION_SECTIONS: CompletionSection[] = [
  { key: "basics", label: "Basic details", weight: 15 },
  { key: "career", label: "Career preferences", weight: 15 },
  { key: "photo", label: "Profile photo", weight: 10 },
  { key: "experience", label: "Work experience", weight: 15 },
  { key: "education", label: "Education", weight: 10 },
  { key: "skills", label: "Skills", weight: 10 },
  { key: "cv", label: "CV / résumé", weight: 10 },
  { key: "certifications", label: "Certifications", weight: 5 },
  { key: "values", label: "Values", weight: 5 },
  { key: "languages", label: "Languages", weight: 5 },
];

/** Employer/organisation (tenant) sections (sum = 100). */
export const TENANT_COMPLETION_SECTIONS: CompletionSection[] = [
  { key: "basics", label: "Organisation basics", weight: 15 },
  { key: "contact", label: "Contact details", weight: 15 },
  { key: "branding", label: "Logo & branding", weight: 10 },
  { key: "photo", label: "Profile photo", weight: 10 },
  { key: "web", label: "Web presence", weight: 10 },
  { key: "missionVision", label: "Mission & vision", weight: 15 },
  { key: "offerings", label: "Products & services", weight: 15 },
  { key: "values", label: "Values", weight: 10 },
];
