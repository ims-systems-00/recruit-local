import { omit } from "lodash";
import { PipelineStage } from "mongoose";
import { bool, eq, ListQuerySpec, objectId, projectQuery } from "../../../common/query";
import { IBoardDoc, Board } from "../../../models";

export const boardProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IBoardDoc | "__v")[] = ["__v"];

  const selectedFields = Object.keys(omit(Board.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};

/**
 * The contract for `GET /boards`.
 *
 * The old `MongoQuery` call searched `["name", "description"]`, but the schema has
 * no `name` — so half that search never matched. It searches `title` here.
 * The free-text key stays `search` rather than the `clientSearch` used elsewhere,
 * because that is the key this module's Joi schema already accepts.
 */
export const boardListQuerySpec: ListQuerySpec = {
  filters: {
    isTemplate: bool("isTemplate"),
    collectionName: eq("collectionName"),
    collectionId: objectId("collectionId"),
  },
  sortable: ["title", "createdAt", "updatedAt"],
  defaultSort: "-createdAt",
  searchKey: "search",
  searchFields: ["title", "description"],
};
