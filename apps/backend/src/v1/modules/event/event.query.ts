import { accessibleBy } from "@casl/mongoose";
import { AbilityAction } from "@rl/types";
import { UserAbilityBuilder, UserAuthZEntity } from "@rl/authz";
import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { Event, IEventDoc } from "../../../models";
import { omit } from "lodash";

export const roleScopedSecurityQuery = (ability: ReturnType<UserAbilityBuilder["getAbility"]>) => {
  // Get the raw query from CASL
  const query = accessibleBy(ability, AbilityAction.Read).ofType(UserAuthZEntity);
  return query;
};

// event queries
export const eventProjectionQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IEventDoc | "__v")[] = ["__v"];

  const selectedFields = Object.keys(omit(Event.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};
