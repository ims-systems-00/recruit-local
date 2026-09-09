import { accessibleBy } from "@casl/mongoose";
import { AbilityAction } from "@rl/types";
import { UserAbilityBuilder, UserAuthZEntity } from "@rl/authz";
import { PipelineStage } from "mongoose";
import { IUserDoc, User } from "../../../models";
import { omit } from "lodash";
import { eq, ListQuerySpec } from "../../../common/query";

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
  const fieldsToExclude: (keyof IUserDoc | "__v")[] = ["__v" as keyof IUserDoc];
  const selectedFields = Object.keys(omit(User.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};

/**
 * `roleScopedSecurityQuery` above is the boundary; these only narrow. `fullName`
 * is a virtual, so it is not searchable — `firstName`/`lastName`/`email` are the
 * stored paths. Anything not listed here never reaches `$match`.
 */
export const userListQuerySpec: ListQuerySpec = {
  filters: {
    role: eq("role"),
    type: eq("type"),
    emailVerificationStatus: eq("emailVerificationStatus"),
    kycStatus: eq("kycStatus"),
  },
  sortable: ["createdAt", "firstName", "lastName", "email"],
  defaultSort: "-createdAt",
  // Kept from the old MongoQuery contract so no frontend call site has to change.
  searchKey: "clientSearch",
  searchFields: ["firstName", "lastName", "email"],
};
