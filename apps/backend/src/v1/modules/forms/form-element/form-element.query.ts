import { eq, ListQuerySpec } from "../../../../common/query";

/**
 * Hardened, and paged by an *offset* cursor rather than a keyset one.
 *
 * `listFormElement` is not a scrollable list — it walks the element chain with
 * `$graphLookup` and returns a form's structure in sequence order. That order is
 * computed by the traversal, not stored on a field, so there is nothing for a
 * keyset to key on; the controller passes `useKeyset: false` and the token
 * carries a `$skip` instead. `defaultSort` is unused for the same reason — the
 * pipeline's own `$sort` on the recursion depth is the order.
 */
export const formElementListQuerySpec: ListQuerySpec = {
  filters: { type: eq("type"), parentElementId: eq("parentElementId") },
  sortable: ["createdAt"],
  defaultSort: "-createdAt",
};
