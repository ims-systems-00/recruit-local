import {
  AbilityBuilder,
  AbilityClass,
  AbilityTuple,
  AnyAbility,
  PureAbility,
  buildMongoQueryMatcher,
  MongoQuery,
  fieldPatternMatcher,
} from '@casl/ability';

import {
  ACCOUNT_TYPE_ENUMS,
  ISession,
  IAbilityBuilder,
  AbilityAction,
} from '@rl/types';

export const ALL_AGENT_CONVERSATION_FIELDS = [
  // --- Base & System Fields ---
  '_id',
  'id',
  'createdAt',
  'updatedAt',

  // --- Soft Delete Plugin ---
  'deleteMarker',
  'deleteMarker.status',
  'deleteMarker.deletedAt',
  'deleteMarker.dateScheduled',

  // --- Ownership ---
  'userId',
  'tenantId',

  // --- Conversation Fields ---
  'title',
  'lastMessageAt',
  'runningSince',

  // --- Session Fingerprint (stale-authorization guard) ---
  'sessionFingerprint',
  'sessionFingerprint.userType',
  'sessionFingerprint.tenantId',
  'sessionFingerprint.jobProfileId',
];

const omitFields = (fieldsToOmit: string[]) =>
  ALL_AGENT_CONVERSATION_FIELDS.filter(
    (field) => !fieldsToOmit.includes(field),
  );

/**
 * The owner never needs to see soft-delete bookkeeping or the lock/fingerprint
 * internals — those are server-side mechanics, not conversation content.
 */
const OWNER_READ_FIELDS = omitFields([
  'deleteMarker',
  'deleteMarker.status',
  'deleteMarker.deletedAt',
  'deleteMarker.dateScheduled',
  'sessionFingerprint',
  'sessionFingerprint.userType',
  'sessionFingerprint.tenantId',
  'sessionFingerprint.jobProfileId',
  'runningSince',
]);

/**
 * Renaming a conversation is the only thing an owner may write directly.
 * Everything else on the document is set by the runtime.
 */
const OWNER_UPDATE_FIELDS = ['title'];

export class AgentConversationAuthZEntity {
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
  MongoQuery<typeof AgentConversationAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

/**
 * Gates access to the AI agent.
 *
 * Every rule is conditioned on `userId`, so this doubles as the ownership check
 * that stops one user reading another's conversation — `accessibleBy` turns the
 * same condition into the Mongo scoping query used by the list endpoint.
 *
 * All three account types are granted today. That is intentional: employers and
 * candidates both use the agent, and keeping it an explicit CASL rule means
 * turning the feature off for a role later is a one-line change here rather
 * than a change to the runtime.
 *
 * This answers only "may you talk to the agent at all". What data the agent can
 * actually reach is decided per tool, by that tool rebuilding its own domain
 * ability from the same session.
 */
export class AgentAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }

  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;
    const userId = this.session.user?._id;

    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) {
      builder.can(AbilityAction.Manage, AgentConversationAuthZEntity);
    }

    if (
      this.session.user.type === ACCOUNT_TYPE_ENUMS.EMPLOYER ||
      this.session.user.type === ACCOUNT_TYPE_ENUMS.CANDIDATE
    ) {
      builder.can(AbilityAction.Create, AgentConversationAuthZEntity);
      builder.can(
        AbilityAction.Read,
        AgentConversationAuthZEntity,
        OWNER_READ_FIELDS,
        { userId },
      );
      builder.can(
        AbilityAction.Update,
        AgentConversationAuthZEntity,
        OWNER_UPDATE_FIELDS,
        { userId },
      );
      builder.can(AbilityAction.SoftDelete, AgentConversationAuthZEntity, {
        userId,
      });
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
      fieldMatcher: fieldPatternMatcher,
    });
  }
}
