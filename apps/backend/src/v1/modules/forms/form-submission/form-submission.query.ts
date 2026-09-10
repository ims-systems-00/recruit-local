import { eq, ListQuerySpec, objectId } from "../../../../common/query";

/**
 * Scoped by the `formId` route param, not by CASL — unchanged by the migration.
 * `name` was the old `searchField` but FormSubmission has no such path, so the
 * search never matched. Anything not listed here never reaches `$match`.
 */
export const formSubmissionListQuerySpec: ListQuerySpec = {
  filters: {
    collectionName: eq("collectionName"),
    // An ObjectId ref whose key does not end in `Id`, so it needs the cast declared.
    collectionDocument: objectId("collectionDocument"),
  },
  sortable: ["createdAt"],
  defaultSort: "-createdAt",
};
