import { accessibleBy } from "@casl/mongoose";
import { AgentAbilityBuilder, AgentConversationAuthZEntity } from "@rl/authz";
import { AbilityAction } from "../../../types/ability";

/**
 * Turns the CASL `{ userId }` condition into a Mongo query. This is the
 * ownership scoping for list reads — one user can never page into another's
 * conversations.
 */
export const agentConversationRoleScopedSecurityQuery = (ability: ReturnType<AgentAbilityBuilder["getAbility"]>) => {
  return accessibleBy(ability, AbilityAction.Read).ofType(AgentConversationAuthZEntity);
};
