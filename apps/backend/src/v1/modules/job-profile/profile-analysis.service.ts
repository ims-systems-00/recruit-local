/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";
import {
  CV_STATUS_ENUM,
  JOB_PROFILE_STATUS_ENUM,
  PROFILE_COMPLETION_SECTIONS,
  StoredCompletion,
  VISIBILITY,
} from "@rl/types";
import { expandCompletion } from "@rl/utils";
import { Experience, Education, Skill, Certification, CV } from "../../../models";
import { recomputeProfileCompletion } from "./profile-completion.service";

/**
 * What is wrong with a candidate's profile, and what it costs them.
 *
 * Completion already answers "how much is filled in" — a weighted percentage and
 * a list of unfinished sections. It cannot answer "why does this matter", and
 * that is the whole question a candidate is actually asking. A profile can be
 * 80% complete and still be invisible to every employer on the platform, or be
 * unscoreable by the ranking that decides where they land on a recruiter's
 * board.
 *
 * So each rule below names a consequence that exists in this codebase — a
 * matcher that will report itself inapplicable, a CASL condition that will hide
 * the profile, a feed that will come back empty — rather than restating the
 * completion section it belongs to.
 *
 * Structured as a registry for the same reason `RANKING_PIPELINE` is: the rules
 * are independent, order-free, and adding one should be appending an entry.
 * Every `run` is pure and synchronous over a snapshot assembled once, so the
 * whole analysis costs one round of queries however many rules there are.
 */

export type ProfileIssueSeverity = "high" | "medium" | "low";

/** Sorted on, so the order of these three is the order issues are reported in. */
const SEVERITY_ORDER: Record<ProfileIssueSeverity, number> = { high: 0, medium: 1, low: 2 };

/** The related-collection counts completion is computed from, kept alongside it. */
export interface ProfileCounts {
  experience: number;
  education: number;
  skills: number;
  certifications: number;
  cvs: number;
}

export interface ProfileSnapshot {
  /** The candidate's profile, populated and already CASL-sanitized by the caller. */
  profile: Record<string, any>;
  counts: ProfileCounts;
}

export interface ProfileIssue {
  code: string;
  severity: ProfileIssueSeverity;
  /** The completion section this belongs to, or a pseudo-section like `visibility`. */
  section: string;
  problem: string;
  fix: string;
  /** What it costs them. The reason this file exists rather than just completion. */
  impact: string;
}

export interface ProfileRule {
  code: string;
  severity: ProfileIssueSeverity;
  section: string;
  /** Returns the finding, or null when this rule has nothing to report. */
  run: (snapshot: ProfileSnapshot) => Pick<ProfileIssue, "problem" | "fix" | "impact"> | null;
}

export interface ProfileAnalysis {
  completionPercentage: number;
  missingSections: string[];
  issues: ProfileIssue[];
  /** True when nothing fired. Stated so a caller never has to infer it from `[]`. */
  healthy: boolean;
}

/** Completion's own threshold for the `skills` section — kept in step with it. */
const MIN_SKILLS = 3;

/** Short enough that an employer learns nothing from it. */
const MIN_SUMMARY_CHARS = 150;

const filledStr = (value: unknown): boolean => typeof value === "string" && value.trim().length > 0;
const filledArr = (value: unknown): boolean => Array.isArray(value) && value.length > 0;

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

/**
 * The two rules that decide whether the profile is scoreable at all.
 *
 * Both matchers they feed report `applicable: false` when their input is
 * missing, and the ranking pipeline then renormalizes the remaining weights. The
 * candidate is not scored badly — they are scored on less evidence, which is
 * worse, because the signal that would have distinguished them is simply not
 * there.
 */
const valuesRule: ProfileRule = {
  code: "no_values",
  severity: "high",
  section: "values",
  run: ({ profile }) =>
    filledArr(profile.values)
      ? null
      : {
          problem: "No values are set on this profile.",
          fix: "Pick the values that describe how you like to work, from the profile's Values section.",
          impact:
            "Values carry the most weight of any signal when an employer's board ranks applicants, and they are " +
            "compared against the values the hiring organisation set. With none on record that comparison cannot " +
            "run at all, so every application is scored on less evidence than a competing candidate's.",
        },
};

const experienceLevelRule: ProfileRule = {
  code: "no_experience_level",
  severity: "high",
  section: "career",
  run: ({ profile }) =>
    profile.experienceLevel
      ? null
      : {
          problem: "No experience level is set.",
          fix: "Choose the experience level that matches your years in the field, under career preferences.",
          impact:
            "A job states the years it wants and your level states the years you have; without it, that half of " +
            "the ranking cannot be computed, and a job you comfortably qualify for scores you no higher than one " +
            "you do not.",
        },
};

/**
 * Keywords are derived, never typed. `recomputeProfileKeywords` builds them from
 * job titles, industries, work modes, skills and interests, so an empty array
 * means those inputs are empty — which is what the fix has to point at.
 */
const keywordsRule: ProfileRule = {
  code: "no_keywords",
  severity: "high",
  section: "career",
  run: ({ profile }) =>
    filledArr(profile.keywords)
      ? null
      : {
          problem: "This profile has no keywords, so it cannot be matched to any job.",
          fix:
            "Keywords are generated from your job titles, industries, work modes, skills and interests — fill " +
            "those in and they appear automatically.",
          impact:
            "Job recommendations work by overlapping your keywords with each job's. With none, the recommended " +
            "jobs list is empty no matter how many suitable roles are open.",
        },
};

/**
 * The one rule that is not about matching. An employer's permission to read a
 * candidate profile is conditioned on exactly these two fields, so failing
 * either makes the profile unreadable to every employer on the platform —
 * regardless of how complete it is.
 */
const discoverabilityRule: ProfileRule = {
  code: "not_discoverable",
  severity: "high",
  section: "visibility",
  run: ({ profile }) => {
    const isPublic = profile.visibility === VISIBILITY.PUBLIC;
    const isVerified = profile.status === JOB_PROFILE_STATUS_ENUM.VERIFIED;
    if (isPublic && isVerified) return null;

    const reasons = [
      ...(isPublic ? [] : ["its visibility is set to private"]),
      ...(isVerified ? [] : ["it has not been verified yet"]),
    ];

    return {
      problem: `This profile cannot be seen by employers because ${reasons.join(" and ")}.`,
      fix: isPublic
        ? "Complete identity verification to have the profile marked verified."
        : "Set the profile's visibility to public" +
          (isVerified ? "." : ", and complete identity verification to have it marked verified."),
      impact:
        "Employers can only open candidate profiles that are both public and verified. Until both hold, an " +
        "employer reviewing an application cannot read the profile behind it.",
    };
  },
};

const summaryRule: ProfileRule = {
  code: "weak_summary",
  severity: "medium",
  section: "basics",
  run: ({ profile }) => {
    const summary = typeof profile.summary === "string" ? profile.summary.trim() : "";
    if (summary.length >= MIN_SUMMARY_CHARS) return null;

    return {
      problem: summary.length === 0 ? "There is no summary." : `The summary is only ${summary.length} characters.`,
      fix: `Write at least ${MIN_SUMMARY_CHARS} characters covering what you do, what you are good at, and what you are looking for.`,
      impact:
        "The summary is the first free text an employer reads on an application, and the only place the profile " +
        "speaks in your own words rather than in catalog selections.",
    };
  },
};

const contactRule: ProfileRule = {
  code: "incomplete_contact",
  severity: "medium",
  section: "basics",
  run: ({ profile }) => {
    const missing = [
      ...(filledStr(profile.name) ? [] : ["name"]),
      ...(filledStr(profile.email) ? [] : ["email"]),
      ...(filledStr(profile.contactNumber) ? [] : ["contact number"]),
      ...(filledStr(profile.address) ? [] : ["address"]),
    ];
    if (missing.length === 0) return null;

    return {
      problem: `Contact details are incomplete — missing ${missing.join(", ")}.`,
      fix: "Fill in the remaining basic details on the profile.",
      impact: "An employer who wants to progress the application has no way to reach you.",
    };
  },
};

const workExperienceRule: ProfileRule = {
  code: "no_work_experience",
  severity: "high",
  section: "experience",
  run: ({ counts }) =>
    counts.experience > 0
      ? null
      : {
          problem: "No work experience entries have been added.",
          fix: "Add each role you have held, with the company, dates and what you did.",
          impact:
            "Work experience is the largest single section of profile completion, and the evidence behind the " +
            "experience level you claim.",
        },
};

const educationRule: ProfileRule = {
  code: "no_education",
  severity: "medium",
  section: "education",
  run: ({ counts }) =>
    counts.education > 0
      ? null
      : {
          problem: "No education entries have been added.",
          fix: "Add your qualifications, with the institution, field of study and dates.",
          impact: "Some employers filter on qualifications before reading anything else on an application.",
        },
};

const skillsRule: ProfileRule = {
  code: "too_few_skills",
  severity: "medium",
  section: "skills",
  run: ({ profile, counts }) => {
    if (counts.skills >= MIN_SKILLS || filledStr(profile.skills)) return null;

    return {
      problem:
        counts.skills === 0
          ? "No skills have been added."
          : `Only ${counts.skills} skill${counts.skills === 1 ? "" : "s"} added, out of the ${MIN_SKILLS} needed.`,
      fix: `Add at least ${MIN_SKILLS} skills, naming the tools and disciplines you actually work in.`,
      impact:
        "Skills feed the keywords a job is matched against, so a thin list narrows which jobs can be recommended " +
        "to you at all.",
    };
  },
};

const cvRule: ProfileRule = {
  code: "no_cv",
  severity: "medium",
  section: "cv",
  run: ({ counts }) =>
    counts.cvs > 0
      ? null
      : {
          problem: "There is no published CV or uploaded résumé on this profile.",
          fix: "Upload a résumé or publish a CV from the CV builder.",
          impact:
            "Most jobs list a CV among their required documents, and an application without one looks unfinished.",
        },
};

const photoRule: ProfileRule = {
  code: "no_photo",
  severity: "low",
  section: "photo",
  run: ({ profile }) =>
    profile.profileImageId
      ? null
      : {
          problem: "No profile photo has been uploaded.",
          fix: "Upload a photo.",
          impact: "A photo is worth a tenth of profile completion on its own, for a minute of work.",
        },
};

const certificationsRule: ProfileRule = {
  code: "no_certifications",
  severity: "low",
  section: "certifications",
  run: ({ counts }) =>
    counts.certifications > 0
      ? null
      : {
          problem: "No certifications have been added.",
          fix: "Add any professional certifications, with the issuing organisation and date.",
          impact: "Optional for most roles, but it is a completion section that is quick to close.",
        },
};

const languagesRule: ProfileRule = {
  code: "no_languages",
  severity: "low",
  section: "languages",
  run: ({ profile }) =>
    filledArr(profile.languages)
      ? null
      : {
          problem: "No languages have been added.",
          fix: "Add the languages you speak and your proficiency in each.",
          impact: "Relevant wherever a role is client-facing or the employer operates across more than one market.",
        },
};

/**
 * Every check, in the order they are declared. Order is presentation only —
 * findings are sorted by severity before they are returned.
 */
export const PROFILE_RULES: ProfileRule[] = [
  discoverabilityRule,
  valuesRule,
  experienceLevelRule,
  keywordsRule,
  workExperienceRule,
  summaryRule,
  contactRule,
  educationRule,
  skillsRule,
  cvRule,
  photoRule,
  certificationsRule,
  languagesRule,
];

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

/**
 * Counts the related records completion is computed from. Mirrors the filter in
 * `recomputeProfileCompletion` exactly — same ownership key, same soft-delete
 * exclusion, same definition of a usable CV — so the two can never disagree
 * about whether a section is complete.
 */
const countRelated = async (userId: string | Types.ObjectId | undefined): Promise<ProfileCounts> => {
  // A profile whose `userId` did not survive sanitization owns nothing this can
  // count. Reported as zeros rather than thrown: the rules then fire on the
  // empty sections, which is advice to fill in what is already filled — wrong,
  // but in the harmless direction, and the alternative is no analysis at all.
  if (!userId || !Types.ObjectId.isValid(String(userId))) {
    return { experience: 0, education: 0, skills: 0, certifications: 0, cvs: 0 };
  }

  const uid = new Types.ObjectId(String(userId));
  const activeFilter = { userId: uid, "deleteMarker.status": { $ne: true } };

  const [experience, education, skills, certifications, cvs] = await Promise.all([
    Experience.countDocuments(activeFilter),
    Education.countDocuments(activeFilter),
    Skill.countDocuments(activeFilter),
    Certification.countDocuments(activeFilter),
    CV.countDocuments({
      ...activeFilter,
      $or: [{ status: CV_STATUS_ENUM.PUBLISHED }, { resumeId: { $ne: null } }],
    }),
  ]);

  return { experience, education, skills, certifications, cvs };
};

/**
 * Runs every rule against one profile.
 *
 * `profile` must already be CASL-sanitized by the caller — this reads it, it
 * does not authorize it. A field the caller may not read is absent, and a rule
 * reading an absent field reports it as missing, which is the safe direction to
 * be wrong in: the worst outcome is advice to fill in something already filled.
 *
 * Completion is recomputed rather than read off the document, for the same
 * reason `get_my_profile` recomputes it: it counts experience, education, skill
 * and certification rows, any of which may have changed since it was last
 * written.
 */
export const analyseJobProfile = async (profile: Record<string, any>): Promise<ProfileAnalysis> => {
  const counts = await countRelated(profile.userId);

  const stored: StoredCompletion | null = profile.userId ? await recomputeProfileCompletion(profile.userId) : null;

  const completion = expandCompletion(
    PROFILE_COMPLETION_SECTIONS,
    stored?.completeSections ?? [],
    stored?.computedAt ?? null
  );

  const snapshot: ProfileSnapshot = { profile, counts };

  const issues = PROFILE_RULES.flatMap((rule) => {
    const finding = rule.run(snapshot);
    return finding ? [{ code: rule.code, severity: rule.severity, section: rule.section, ...finding }] : [];
  }).sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  return {
    completionPercentage: completion.percentage,
    missingSections: completion.missing,
    issues,
    healthy: issues.length === 0,
  };
};
