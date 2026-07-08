/**
 * Generic, dependency-free completion engine.
 *
 * The domain-specific predicates (what makes "experience" or "branding"
 * complete) live in each backend module's recompute service. This module only
 * does the weighted arithmetic and the lean<->breakdown hydration, so it can be
 * shared by any feature (job profiles, tenants, …) and the frontend.
 */

/** One section's weight and whether its predicate passed. */
export interface CompletionSectionInput {
  key: string;
  weight: number;
  complete: boolean;
}

/** The lean result that gets persisted on a document. */
export interface ComputedCompletion {
  percentage: number;
  completeSections: string[];
}

/** A weighted section config entry (matches @rl/types CompletionSection). */
export interface CompletionConfigSection {
  key: string;
  label: string;
  weight: number;
}

/** A config section enriched with completeness. */
export interface CompletionSectionResult extends CompletionConfigSection {
  complete: boolean;
}

/** The fully expanded breakdown handed back to clients. */
export interface ExpandedCompletion {
  percentage: number;
  sections: CompletionSectionResult[];
  missing: string[];
  computedAt: string | null;
}

const toPercentage = (sections: { weight: number; complete: boolean }[]): number => {
  const totalWeight = sections.reduce((sum, s) => sum + s.weight, 0) || 1;
  const earned = sections.reduce((sum, s) => (s.complete ? sum + s.weight : sum), 0);
  return Math.round((earned / totalWeight) * 100);
};

/**
 * Reduce evaluated sections to a lean, storable result. Normalised against the
 * total weight, so it stays correct even if the weights don't sum to exactly 100.
 */
export const computeCompletion = (sections: CompletionSectionInput[]): ComputedCompletion => {
  const percentage = toPercentage(sections);
  const completeSections = sections.filter((s) => s.complete).map((s) => s.key);
  return { percentage, completeSections };
};

/**
 * Hydrate a stored lean result into the full breakdown using a section config:
 * attaches labels/weights, derives `missing`, and recomputes the percentage so
 * the returned number always agrees with the config.
 */
export const expandCompletion = (
  config: CompletionConfigSection[],
  completeSections: string[] = [],
  computedAt?: Date | string | null
): ExpandedCompletion => {
  const completeSet = new Set(completeSections);
  const sections: CompletionSectionResult[] = config.map((s) => ({ ...s, complete: completeSet.has(s.key) }));
  const missing = sections.filter((s) => !s.complete).map((s) => s.key);
  const iso = computedAt instanceof Date ? computedAt.toISOString() : (computedAt ?? null);
  return { percentage: toPercentage(sections), sections, missing, computedAt: iso };
};
