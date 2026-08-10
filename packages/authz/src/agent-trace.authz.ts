import {
  AbilityBuilder,
  AbilityClass,
  AbilityTuple,
  AnyAbility,
  PureAbility,
  buildMongoQueryMatcher,
  MongoQuery,
} from '@casl/ability';

import {
  ACCOUNT_TYPE_ENUMS,
  ISession,
  IAbilityBuilder,
  AbilityAction,
} from '@rl/types';

export const ALL_AGENT_TRACE_FIELDS = [
  // --- Base & System Fields ---
  '_id',
  'id',
  'createdAt',
  'updatedAt',

  // --- Attribution ---
  'conversationId',
  'userId',
  'userType',
  'tenantId',
  'jobProfileId',

  // --- Run Fields ---
  'prompt',
  'llmModel',
  // Which stored prompt version framed this run — null when the code fallback
  // was used. Together with `llmModel` this is what makes a bad answer
  // reproducible.
  'promptName',
  'promptVersion',
  'status',
  'stoppedReason',
  'error',
  'steps',
  'toolCallCount',
  'llmCallCount',
  'totalDurationMs',
  'toolDurationMs',
  'llmDurationMs',
  'usage',
  'usage.promptTokens',
  'usage.completionTokens',
  'usage.totalTokens',

  // --- Spans ---
  'toolTrace',
  'toolTrace.*',
  'llmCalls',
  'llmCalls.*',
];

export class AgentTraceAuthZEntity {
  public readonly userId: string | null;
  public readonly tenantId: string | null;

  // Accepts unknown for the ids because callers pass raw documents, where these
  // are ObjectIds rather than strings. Both are coerced here so CASL's
  // conditions always compare like with like.
  constructor({ userId, tenantId }: { userId?: unknown; tenantId?: unknown }) {
    this.userId = userId ? String(userId) : null;
    this.tenantId = tenantId ? String(tenantId) : null;
  }
}

type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof AgentTraceAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

/**
 * Gates the agent's run traces.
 *
 * Platform admin only, and deliberately narrower than the conversation rules:
 * a trace stores the user's prompt verbatim, so unlike a conversation — which
 * its owner may read — this is operational telemetry across all users and is
 * not something an owner has any reason to reach.
 *
 * Granting a role read access later means adding a `{ userId }`-conditioned rule
 * here; the entity already carries the fields such a condition would need.
 */
export class AgentTraceAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }

  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;

    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) {
      builder.can(AbilityAction.Manage, AgentTraceAuthZEntity);
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
    });
  }
}
