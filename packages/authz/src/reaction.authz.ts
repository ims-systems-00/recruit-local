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

// --- FIELD DEFINITIONS ---
export const ALL_REACTION_FIELDS = [
  '_id',
  'id',
  // The reactor — exactly one of the pair is set (server-derived from the
  // session, never accepted on writes, hence absent from MUTATION_FIELDS).
  'tenantId',
  'jobProfileId',
  // The reacted-to document.
  'collectionName',
  'collectionId',
  'type',
  'createdAt',
  'updatedAt',
];

// What a reactor may set on create: the target and the reaction itself.
const CREATE_FIELDS = ['collectionName', 'collectionId', 'type'];

// A reaction never moves to another target, so only the reaction itself changes.
const UPDATE_FIELDS = ['type'];

// --- AUTHZ ENTITY ---
export class ReactionAuthZEntity {
  public readonly _id: string | null;
  public readonly tenantId: string | null;
  public readonly jobProfileId: string | null;

  constructor({
    _id,
    tenantId,
    jobProfileId,
  }: {
    _id?: string | null;
    tenantId?: string | null;
    jobProfileId?: string | null;
  }) {
    this._id = _id ? String(_id) : null;
    // Coerce the owner refs to strings so they compare cleanly against the
    // session's ids in the per-document condition check.
    this.tenantId = tenantId ? String(tenantId) : null;
    this.jobProfileId = jobProfileId ? String(jobProfileId) : null;
  }
}

type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof ReactionAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

// --- ABILITY BUILDER ---
export class ReactionAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }

  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;
    const { user, tenantId, jobProfileId } = this.session;

    // 1. PLATFORM ADMIN — full control.
    if (user.type === ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) {
      builder.can(AbilityAction.Manage, ReactionAuthZEntity);
      return this.buildAbility();
    }

    // 2. EMPLOYER — reacts as its tenant, and may only touch those reactions.
    if (user.type === ACCOUNT_TYPE_ENUMS.EMPLOYER && tenantId) {
      builder.can(AbilityAction.Create, ReactionAuthZEntity, CREATE_FIELDS);
      builder.can(AbilityAction.Update, ReactionAuthZEntity, UPDATE_FIELDS, {
        tenantId,
      });
      builder.can(AbilityAction.SoftDelete, ReactionAuthZEntity, { tenantId });
      builder.can(AbilityAction.Restore, ReactionAuthZEntity, { tenantId });
      builder.can(AbilityAction.HardDelete, ReactionAuthZEntity, { tenantId });
    }

    // 3. CANDIDATE — reacts as its job profile, and may only touch those.
    if (user.type === ACCOUNT_TYPE_ENUMS.CANDIDATE && jobProfileId) {
      builder.can(AbilityAction.Create, ReactionAuthZEntity, CREATE_FIELDS);
      builder.can(AbilityAction.Update, ReactionAuthZEntity, UPDATE_FIELDS, {
        jobProfileId,
      });
      builder.can(AbilityAction.SoftDelete, ReactionAuthZEntity, {
        jobProfileId,
      });
      builder.can(AbilityAction.Restore, ReactionAuthZEntity, { jobProfileId });
      builder.can(AbilityAction.HardDelete, ReactionAuthZEntity, {
        jobProfileId,
      });
    }

    // 4. EVERYONE — reactions are a public signal on public content: any viewer
    // must be able to read the full set on a document to count them and show who
    // reacted. This is the deliberate difference from a favourite, which is
    // private to its owner.
    builder.can(AbilityAction.Read, ReactionAuthZEntity, ALL_REACTION_FIELDS);

    return this.buildAbility();
  }

  private buildAbility(): AnyAbility {
    return this.abilityBuilder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
      fieldMatcher: fieldPatternMatcher,
    });
  }
}
