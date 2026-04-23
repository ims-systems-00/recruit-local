import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { Favourite, IFavouriteDoc } from "../../../models";
import { accessibleBy } from "@casl/mongoose";
import { AbilityAction } from "@rl/types";
import { FavouriteAbilityBuilder, FavouriteAuthZEntity } from "@rl/authz";

export const favouriteProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IFavouriteDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(Favourite.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};

export const favouriteRoleScopedSecurityQuery = (ability: ReturnType<FavouriteAbilityBuilder["getAbility"]>) => {
  return accessibleBy(ability, AbilityAction.Read).ofType(FavouriteAuthZEntity);
};
