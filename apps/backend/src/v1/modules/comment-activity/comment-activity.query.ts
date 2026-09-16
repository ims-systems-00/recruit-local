import { eq, ListQuerySpec, objectId } from "../../../common/query";

/**
 * The contract for `GET /comment-activities`.
 *
 * The old `MongoQuery` call declared `searchFields: ["title"]` and turned every
 * other query param into a `$match`, so the list was filterable by anything and
 * validated by nothing. These are the keys it actually makes sense to filter on.
 */
export const commentActivityListQuerySpec: ListQuerySpec = {
  filters: {
    collectionName: eq("collectionName"),
    collectionDocument: objectId("collectionDocument"),
    type: eq("type"),
    createdBy: objectId("createdBy"),
  },
  sortable: ["createdAt", "updatedAt"],
  defaultSort: "-createdAt",
  searchKey: "clientSearch",
  searchFields: ["title"],
};
