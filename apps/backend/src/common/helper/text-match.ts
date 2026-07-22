/** Pure text-similarity helpers (no DB imports) shared by CV matching and application ranking. */

export const normalize = (str: string): string =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");

const wordOverlapScore = (a: string, b: string): number => {
  const wordsA = normalize(a)
    .split(" ")
    .filter((w) => w.length > 2);
  const wordsB = normalize(b)
    .split(" ")
    .filter((w) => w.length > 2);
  if (!wordsA.length || !wordsB.length) return 0;
  const setB = new Set(wordsB);
  const overlap = wordsA.filter((w) => setB.has(w)).length;
  return overlap / Math.max(wordsA.length, wordsB.length);
};

/** 0..1 similarity: exact=1, substring=0.9, else word-overlap ratio. */
export const matchScore = (a: string, b: string): number => {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;
  return wordOverlapScore(na, nb);
};
