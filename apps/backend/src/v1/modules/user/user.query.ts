import { accessibleBy } from "@casl/mongoose";
import { AbilityAction } from "@rl/types";
import { UserAbilityBuilder, UserAuthZEntity } from "@rl/authz";
import { PipelineStage } from "mongoose";

export const roleScopedSecurityQuery = (ability: ReturnType<UserAbilityBuilder["getAbility"]>) => {
  // Get the raw query from CASL
  const query = accessibleBy(ability, AbilityAction.Read).ofType(UserAuthZEntity);
  return query;
};

// todo : this could be moved to a common helper since it can be used in other modules as well
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// user queries

export const userProjectionQuery = (): PipelineStage[] => {
  return projectQuery([
    "firstName",
    "lastName",
    "tenantId",
    "email",
    "role",
    "type",
    "emailVerificationStatus",
    "profileImage",
    "createdAt",
    "updatedAt",
  ]);
};
