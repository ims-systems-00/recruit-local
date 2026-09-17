import { Model, Types } from "mongoose";
import { CANDIDATE_ONBOARDING_SEQUENCE, ONBOARDING_STEP_ENUMS } from "@rl/types";
import { ExperienceLevel, Industry, JobTitle, WorkMode } from "../../../../models";

/**
 * The catalogs a candidate picks from during personalisation, described once so
 * the search tool and the set tool cannot disagree about any of them.
 *
 * Location is deliberately absent: it is geocoded free text, not a catalog, and
 * `update_my_profile` already writes `address`.
 */

export const CATALOG_KINDS = ["job_title", "industry", "experience_level", "work_mode"] as const;
export type CatalogKind = (typeof CATALOG_KINDS)[number];

export interface ICatalogConfig {
  /** Human wording, singular and plural, for previews and errors. */
  label: string;
  pluralLabel: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: Model<any>;
  /** The job-profile field the selection is stored on. */
  profileField: "jobTitle" | "industry" | "experienceLevel" | "workMode";
  /**
   * `experienceLevel` is a single ObjectId on the schema; the others are arrays.
   * Writing an array into a single-ref field would be a cast error at best.
   */
  multiple: boolean;
  /**
   * Mirrors `MAX_*_STEP_SELECTION` in the frontend's validation files, which is
   * what the onboarding screens enforce. Nothing server-side caps these today, so
   * matching the screens is the only way the two routes stay equivalent.
   */
  max: number;
  /** The onboarding step this selection completes. */
  step: ONBOARDING_STEP_ENUMS;
}

export const CATALOGS: Record<CatalogKind, ICatalogConfig> = {
  job_title: {
    label: "job title",
    pluralLabel: "job titles",
    model: JobTitle,
    profileField: "jobTitle",
    multiple: true,
    max: 3,
    step: ONBOARDING_STEP_ENUMS.JOB_TITLE,
  },
  industry: {
    label: "industry",
    pluralLabel: "industries",
    model: Industry,
    profileField: "industry",
    multiple: true,
    max: 3,
    step: ONBOARDING_STEP_ENUMS.INDUSTRY,
  },
  experience_level: {
    label: "experience level",
    pluralLabel: "experience levels",
    model: ExperienceLevel,
    profileField: "experienceLevel",
    multiple: false,
    max: 1,
    step: ONBOARDING_STEP_ENUMS.EXPERIENCE_LEVEL,
  },
  work_mode: {
    label: "work mode",
    pluralLabel: "work modes",
    model: WorkMode,
    profileField: "workMode",
    multiple: true,
    max: 3,
    step: ONBOARDING_STEP_ENUMS.WORK_MODE,
  },
};

/**
 * Only rows a candidate could have picked on the screen count: active and not
 * soft-deleted. The catalog controllers pin `isActive` the same way.
 */
export const selectableFilter = { isActive: true, "deleteMarker.status": { $ne: true } };

export interface ICatalogRow {
  _id: string;
  name: string;
  description?: string;
}

/**
 * Loads exactly the rows named by `ids`, in the order given.
 *
 * Returns the missing ids separately rather than throwing, so the caller can say
 * which choice was not found — an id the model invented, or one retired from the
 * catalog since it was searched.
 */
export const loadRows = async (
  kind: CatalogKind,
  ids: string[]
): Promise<{ rows: ICatalogRow[]; missing: string[] }> => {
  const valid = ids.filter((id) => Types.ObjectId.isValid(id));

  const docs = await CATALOGS[kind].model
    .find({ _id: { $in: valid.map((id) => new Types.ObjectId(id)) }, ...selectableFilter })
    .select("name description")
    .lean();

  const byId = new Map(
    (docs as unknown as { _id: Types.ObjectId; name: string; description?: string }[]).map((doc) => [
      String(doc._id),
      { _id: String(doc._id), name: doc.name, ...(doc.description ? { description: doc.description } : {}) },
    ])
  );

  return {
    rows: ids.map((id) => byId.get(id)).filter((row): row is ICatalogRow => Boolean(row)),
    missing: ids.filter((id) => !byId.has(id)),
  };
};

/**
 * The step to store after this selection, or null to leave it alone.
 *
 * Forward only. Re-choosing industries after finishing setup must not rewind a
 * completed onboarding, and an unrecognised stored step (for instance one from
 * the employer flow) counts as "not started", so the selection may advance it.
 */
export const nextOnboardingStep = (
  stored: ONBOARDING_STEP_ENUMS | undefined | null,
  target: ONBOARDING_STEP_ENUMS
): ONBOARDING_STEP_ENUMS | null => {
  if (stored === ONBOARDING_STEP_ENUMS.COMPLETED) return null;

  const current = stored ? CANDIDATE_ONBOARDING_SEQUENCE.indexOf(stored) : -1;
  const wanted = CANDIDATE_ONBOARDING_SEQUENCE.indexOf(target);

  return wanted > current ? target : null;
};

/** Escaped for use in a RegExp; the query is model-supplied. */
export const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
