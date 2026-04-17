import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { Favourite, IFavouriteDoc } from "../../../models";

export const favouriteProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IFavouriteDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(Favourite.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};
