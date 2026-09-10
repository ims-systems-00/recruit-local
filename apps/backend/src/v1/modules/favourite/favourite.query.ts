import { PipelineStage } from "mongoose";
import { dateRange, eq, ListQuerySpec, projectQuery } from "../../../common/query";
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

/**
 * `favouriteRoleScopedSecurityQuery` is the boundary; these only narrow. No
 * `searchFields` — a Favourite carries no text of its own, only a pointer to the
 * thing it bookmarks.
 */
export const favouriteListQuerySpec: ListQuerySpec = {
  filters: {
    tenantId: eq("tenantId"),
    jobProfileId: eq("jobProfileId"),
    itemId: eq("itemId"),
    itemType: eq("itemType"),
    createdAt: dateRange("createdAt"),
  },
  sortable: ["createdAt"],
  defaultSort: "-createdAt",
};
