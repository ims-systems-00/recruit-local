import assert from "assert";

// ponytail: tiny stopword set, grow it only if match noise shows up in practice.
const STOPWORDS = new Set([
  "and",
  "the",
  "for",
  "with",
  "you",
  "are",
  "our",
  "who",
  "was",
  "will",
  "from",
  "this",
  "that",
  "have",
  "has",
  "your",
  "job",
  "role",
  "team",
  "work",
  "not",
]);

/**
 * Deterministic keyword extraction shared by the keyword-update queue.
 *
 * Tokenizes free text and structured field values into a normalized, deduped,
 * lowercased token set. Both Job.keywords[] and JobProfile.keywords[] are built
 * through this same function so they draw from an identical vocabulary and can be
 * `$setIntersection`-ed for match scoring in the jobs list.
 */
export const buildKeywords = (parts: (string | null | undefined)[]): string[] => {
  const tokens = new Set<string>();
  for (const part of parts) {
    if (!part) continue;
    // keep + and # so "c++" / "node.js" style tokens survive splitting
    for (const raw of part.toLowerCase().split(/[^a-z0-9+#]+/)) {
      const t = raw.trim();
      if (t.length < 3 || STOPWORDS.has(t)) continue;
      tokens.add(t);
    }
  }
  return [...tokens];
};

// ponytail: single runnable check for the money path (intersection is non-empty).
// Run with: npx ts-node src/common/helper/keywords.ts
const demo = () => {
  const job = buildKeywords(["Senior React Developer", "Engineering", "FULL_TIME"]);
  const profile = buildKeywords(["React Developer", "software engineering", null]);
  const overlap = job.filter((k) => profile.includes(k));

  assert(job.includes("react") && job.includes("developer"), "job tokens must include react+developer");
  assert(!job.includes("job") && !job.includes("and"), "stopwords must be dropped");
  assert(overlap.length > 0, "job/profile keyword sets must intersect");

  console.log("keywords self-check ok, overlap:", overlap);
};

if (require.main === module) demo();
