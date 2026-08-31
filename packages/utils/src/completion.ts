/**
 * Generic, dependency-free completion engine.
 *
 * The domain-specific predicates (what makes "experience" or "branding"
 * filled) live in each backend module's recompute service. This module only
 * does the weighted arithmetic and the lean<->breakdown hydration, so it can be
 * shared by any feature (job profiles, tenants, …) and the frontend.
 *
 * Every field in a section carries an equal share of that section's weight, so
 * filling 4 of 5 fields in a 15-point section earns 12, not 0.
 */

/** One scorable input inside a section (matches @rl/types CompletionField). */
export interface CompletionFieldConfig {
  key: string;
  label: string;
}

/** A weighted section config entry (matches @rl/types CompletionSection). */
export interface CompletionConfigSection {
  key: string;
  label: string;
  weight: number;
  fields: CompletionFieldConfig[];
}

/** A config section enriched with what it scored. */
export interface CompletionSectionResult extends CompletionConfigSection {
  complete: boolean;
  earned: number;
  missingFields: CompletionFieldConfig[];
}

/** The lean result that gets persisted on a document. */
export interface ComputedCompletion {
  percentage: number;
  completeFields: string[];
  completeSections: string[];
}

/** The fully expanded breakdown handed back to clients. */
export interface ExpandedCompletion {
  percentage: number;
  sections: CompletionSectionResult[];
  missing: string[];
  missingFields: CompletionFieldConfig[];
  computedAt: string | null;
}

/** What `expandCompletion` reads off a stored document. */
export interface StoredCompletionInput {
  completeFields?: string[];
  completeSections?: string[];
  computedAt?: Date | string | null;
}

const scoreSections = (config: CompletionConfigSection[], satisfied: Set<string>): CompletionSectionResult[] =>
  config.map((section) => {
    const total = section.fields.length || 1;
    const missingFields = section.fields.filter((f) => !satisfied.has(f.key));
    const done = section.fields.length - missingFields.length;
    return { ...section, earned: (section.weight * done) / total, complete: missingFields.length === 0, missingFields };
  });

// Kept as a float until the very end — rounding each section first would drift.
const toPercentage = (sections: CompletionSectionResult[]): number => {
  const totalWeight = sections.reduce((sum, s) => sum + s.weight, 0) || 1;
  const earned = sections.reduce((sum, s) => sum + s.earned, 0);
  return Math.round((earned / totalWeight) * 100);
};

/**
 * Score a config against the field keys whose predicates passed, and reduce it
 * to a lean, storable result. Normalised against the total weight, so it stays
 * correct even if the weights don't sum to exactly 100.
 */
export const computeCompletion = (
  config: CompletionConfigSection[],
  satisfiedFieldKeys: string[]
): ComputedCompletion => {
  const satisfied = new Set(satisfiedFieldKeys);
  const sections = scoreSections(config, satisfied);

  return {
    percentage: toPercentage(sections),
    // Only keys the config knows about, so a renamed predicate can't leak through.
    completeFields: config.flatMap((s) => s.fields.filter((f) => satisfied.has(f.key)).map((f) => f.key)),
    completeSections: sections.filter((s) => s.complete).map((s) => s.key),
  };
};

/**
 * Hydrate a stored lean result into the full breakdown using a section config:
 * attaches labels/weights, derives `missing`, and recomputes the percentage so
 * the returned number always agrees with the config.
 *
 * Documents written before per-field scoring have no `completeFields`. For those
 * we treat every field of each stored complete section as satisfied, so an
 * un-backfilled document keeps its old percentage instead of dropping to 0.
 */
export const expandCompletion = (
  config: CompletionConfigSection[],
  stored?: StoredCompletionInput | null
): ExpandedCompletion => {
  const satisfied = stored?.completeFields
    ? new Set(stored.completeFields)
    : new Set(
        config
          .filter((s) => (stored?.completeSections ?? []).includes(s.key))
          .flatMap((s) => s.fields.map((f) => f.key))
      );

  const sections = scoreSections(config, satisfied);
  const computedAt = stored?.computedAt;
  const iso = computedAt instanceof Date ? computedAt.toISOString() : (computedAt ?? null);

  return {
    percentage: toPercentage(sections),
    sections,
    missing: sections.filter((s) => !s.complete).map((s) => s.key),
    missingFields: sections.flatMap((s) => s.missingFields),
    computedAt: iso,
  };
};
