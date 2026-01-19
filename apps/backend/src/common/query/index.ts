import { PipelineStage } from "mongoose";
import { accessibleBy } from "@casl/mongoose";
import { AnyMongoAbility } from "@casl/ability";
import { AbilityAction } from "../../types/ability";

type Constructor<T> = new (...args: any[]) => T;

export const roleScopedSecurityQuery = <T>(entity: Constructor<T>, ability: AnyMongoAbility) => {
  const query = accessibleBy(ability, AbilityAction.Read).ofType(entity);
  return query;
};

export const matchQuery = (query: any): PipelineStage[] => {
  return [{ $match: { ...query } }];
};

export const projectQuery = (fields: string[]): PipelineStage[] => {
  const projection: Record<string, number> = {};
  fields.forEach((field) => {
    projection[field] = 1;
  });

  return [{ $project: projection }];
};

export const excludeDeletedQuery = (): PipelineStage[] => {
  return [
    {
      $match: {
        "deleteMarker.status": {
          $ne: true,
        },
      },
    },
  ];
};

export const onlyDeletedQuery = (): PipelineStage[] => {
  return [
    {
      $match: {
        "deleteMarker.status": true,
      },
    },
  ];
};
