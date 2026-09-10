import { eq, ListQuerySpec } from "../../../common/query";

/**
 * See the warning on `listQuerySchema`: this list is not scoped to the viewer, so
 * `userId` here is a convenience filter, not a boundary. Anything not listed here
 * never reaches `$match`.
 */
export const notificationListQuerySpec: ListQuerySpec = {
  filters: { userId: eq("userId"), status: eq("status") },
  sortable: ["createdAt"],
  defaultSort: "-createdAt",
  searchKey: "clientSearch",
  searchFields: ["title", "value"],
};
