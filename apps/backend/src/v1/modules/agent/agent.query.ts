import { accessibleBy } from "@casl/mongoose";
import { AgentAbilityBuilder, AgentConversationAuthZEntity } from "@rl/authz";
import { AbilityAction } from "../../../types/ability";
import { ListQuerySpec } from "../../../common/query";

/**
 * Turns the CASL `{ userId }` condition into a Mongo query. This is the
 * ownership scoping for list reads — one user can never page into another's
 * conversations.
 */
export const agentConversationRoleScopedSecurityQuery = (ability: ReturnType<AgentAbilityBuilder["getAbility"]>) => {
  return accessibleBy(ability, AbilityAction.Read).ofType(AgentConversationAuthZEntity);
};

/**
 * `agentConversationRoleScopedSecurityQuery` is the boundary; this only shapes
 * the page. Anything not listed here never reaches `$match`.
 */
export const agentConversationListQuerySpec: ListQuerySpec = {
  filters: {},
  sortable: ["lastMessageAt", "createdAt"],
  defaultSort: "-lastMessageAt",
  // Kept from the old MongoQuery contract so no frontend call site has to change.
  searchKey: "clientSearch",
  searchFields: ["title"],
};
