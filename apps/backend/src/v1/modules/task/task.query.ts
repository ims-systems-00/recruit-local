import { eq, ListQuerySpec, objectId, objectIdIn } from "../../../common/query";

/**
 * The contract for `GET /tasks`.
 *
 * The old `MongoQuery` call declared `searchFields: ["title"]` and turned every
 * other query param into a `$match`, so the list was filterable by anything and
 * validated by nothing. These are the keys it actually makes sense to filter on.
 */
export const taskListQuerySpec: ListQuerySpec = {
  filters: {
    status: eq("status"),
    priority: eq("priority"),
    assignedTo: objectIdIn("assignedTo"),
    createdBy: objectId("createdBy"),
    auditId: objectId("auditId"),
    category: objectId("category"),
  },
  sortable: ["createdAt", "updatedAt", "dueDate", "title"],
  defaultSort: "-createdAt",
  searchKey: "clientSearch",
  searchFields: ["title"],
};
