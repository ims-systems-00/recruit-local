import { eq, ListQuerySpec } from "../../../../common/query";

/**
 * Hardened, but deliberately still offset-paged.
 *
 * `listFormElement` is not a scrollable list — it walks the element chain with
 * `$graphLookup` and returns a form's structure in sequence order. A cursor over
 * a graph-built sequence would key on a field the traversal does not order by, so
 * it is left on `aggregatePaginate`. What changes here is only that query params
 * stop reaching `$match` unchecked.
 */
export const formElementListQuerySpec: ListQuerySpec = {
  filters: { type: eq("type"), parentElementId: eq("parentElementId") },
  sortable: ["createdAt"],
  defaultSort: "-createdAt",
};
