import { eq, ListQuerySpec } from "../../../../common/query";

/**
 * This list has no CASL scoping — unchanged by the migration. Anything not listed
 * here never reaches `$match`.
 */
export const formListQuerySpec: ListQuerySpec = {
  filters: { collectionName: eq("collectionName"), collectionId: eq("collectionId"), status: eq("status") },
  sortable: ["createdAt", "title"],
  defaultSort: "-createdAt",
  searchKey: "clientSearch",
  searchFields: ["title", "description"],
};
