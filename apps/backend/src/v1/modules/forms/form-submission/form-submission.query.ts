import { eq, ListQuerySpec } from "../../../../common/query";

/**
 * Scoped by the `formId` route param, not by CASL — unchanged by the migration.
 * `name` was the old `searchField` but FormSubmission has no such path, so the
 * search never matched. Anything not listed here never reaches `$match`.
 */
export const formSubmissionListQuerySpec: ListQuerySpec = {
  filters: { collectionName: eq("collectionName"), collectionDocument: eq("collectionDocument") },
  sortable: ["createdAt"],
  defaultSort: "-createdAt",
};
