import { JobTitle, Industry, WorkMode, ExperienceLevel } from "../../../models";
import { matchScore } from "../../../common/helper/text-match";

interface NamedEntity {
  _id: unknown;
  name: string;
}

export const matchEntities = <T extends NamedEntity>(aiValues: string[], dbEntities: T[], threshold = 0.3): T[] => {
  if (!aiValues?.length || !dbEntities?.length) return [];

  // Keep the best score per entity, then rank so callers can take the top N.
  const best = new Map<string, { entity: T; score: number }>();

  for (const aiValue of aiValues) {
    for (const entity of dbEntities) {
      const score = matchScore(aiValue, entity.name);
      if (score < threshold) continue;

      const key = String(entity._id);
      const prev = best.get(key);
      if (!prev || score > prev.score) best.set(key, { entity, score });
    }
  }

  return [...best.values()].sort((a, b) => b.score - a.score).map((m) => m.entity);
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
    jobTitles: matchEntities(extractedData.jobTitles ?? [], jobTitles).slice(0, 3),
    industries: matchEntities(extractedData.industries ?? [], industries).slice(0, 3),
    workModes: matchEntities(extractedData.workModes ?? [], workModes).slice(0, 3),
    experienceLevels: matchEntities(extractedData.experienceLevels ?? [], experienceLevels).slice(0, 1),
  };
};
