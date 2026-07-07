import { JobTitle, Industry, WorkMode, ExperienceLevel } from "../../../models";

interface NamedEntity {
  _id: unknown;
  name: string;
}

const normalize = (str: string): string =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");

const wordOverlapScore = (a: string, b: string): number => {
  const wordsA = normalize(a).split(" ").filter((w) => w.length > 2);
  const wordsB = normalize(b).split(" ").filter((w) => w.length > 2);
  if (!wordsA.length || !wordsB.length) return 0;
  const setB = new Set(wordsB);
  const overlap = wordsA.filter((w) => setB.has(w)).length;
  return overlap / Math.max(wordsA.length, wordsB.length);
};

export const matchEntities = <T extends NamedEntity>(
  aiValues: string[],
  dbEntities: T[],
  threshold = 0.3
): T[] => {
  if (!aiValues?.length || !dbEntities?.length) return [];

  const matched = new Map<string, T>();

  for (const aiValue of aiValues) {
    const normAI = normalize(aiValue);
    for (const entity of dbEntities) {
      const normDB = normalize(entity.name);
      const key = String(entity._id);

      if (matched.has(key)) continue;

      if (normAI === normDB || normAI.includes(normDB) || normDB.includes(normAI)) {
        matched.set(key, entity);
        continue;
      }

      if (wordOverlapScore(normAI, normDB) >= threshold) {
        matched.set(key, entity);
      }
    }
  }

  return [...matched.values()];
};

const ACTIVE_FILTER = { $match: { isActive: true, "deleteMarker.status": { $ne: true } } };

export const matchCvEntities = async (extractedData: Record<string, string[]>) => {
  const [jobTitles, industries, workModes, experienceLevels] = await Promise.all([
    JobTitle.aggregate<NamedEntity>([ACTIVE_FILTER, { $project: { _id: 1, name: 1 } }]),
    Industry.aggregate<NamedEntity>([ACTIVE_FILTER, { $project: { _id: 1, name: 1 } }]),
    WorkMode.aggregate<NamedEntity>([ACTIVE_FILTER, { $project: { _id: 1, name: 1 } }]),
    ExperienceLevel.aggregate<NamedEntity>([ACTIVE_FILTER, { $project: { _id: 1, name: 1 } }]),
  ]);

  return {
    jobTitles: matchEntities(extractedData.jobTitles ?? [], jobTitles),
    industries: matchEntities(extractedData.industries ?? [], industries),
    workModes: matchEntities(extractedData.workModes ?? [], workModes),
    experienceLevels: matchEntities(extractedData.experienceLevels ?? [], experienceLevels),
  };
};
