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
  POST_STATUS_ENUMS,
} from '@rl/types';

// --- FIELD DEFINITIONS ---
export const ALL_POST_FIELDS = [
  '_id',
  'tenantId',
  'jobProfileId',
  'title',
  'text',
  'banner',
  'images',
  'keywords',
  'type',
  'status',
  'schedule',
  // Transient upload templates accepted on writes (resolved to FileMedia refs).
  'bannerStorage',
  'bannerStorage.*',
  'imagesStorage',
  'imagesStorage.*',
  'createdAt',
  'updatedAt',
];

const omitFields = (fieldsToOmit: string[]) =>
  ALL_POST_FIELDS.filter((field) => !fieldsToOmit.includes(field));

// What the public (candidates, other tenants) may read: no editorial internals
// (draft status, scheduling) and no write-only upload templates.
const PUBLIC_READ_FIELDS = omitFields([
  'status',
  'schedule',
  'bannerStorage',
  'bannerStorage.*',
  'imagesStorage',
  'imagesStorage.*',
]);

// Fields an employer may set on create/update (`tenantId`/`jobProfileId` are server-set).
const EMPLOYER_MUTATION_FIELDS = [
  'title',
  'text',
  'keywords',
  'type',
  'status',
  'schedule',
  'bannerStorage',
  'bannerStorage.*',
  'imagesStorage',
  'imagesStorage.*',
];

// --- AUTHZ ENTITY ---
export class PostAuthZEntity {
  public readonly _id: string | null;
  public readonly tenantId: string | null;
  public readonly status: POST_STATUS_ENUMS;
  constructor({
    _id,
    tenantId,
    status,
  }: {
    _id?: string | null;
    tenantId?: string | null;
    status?: POST_STATUS_ENUMS;
  }) {
    this._id = _id ? String(_id) : null;
    // Coerce the tenant ref to a string so it compares cleanly against the
    // session's `tenantId` in the per-document condition check.
    this.tenantId = tenantId ? String(tenantId) : null;
    this.status = status ?? POST_STATUS_ENUMS.DRAFT;
  }
}

type ClaimAbility = PureAbility<AbilityTuple, MongoQuery<typeof PostAuthZEntity>>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

// --- ABILITY BUILDER ---
export class PostAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }

  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;
    const { user, tenantId } = this.session;

    // 1. PLATFORM ADMIN — full control.
    if (user.type === ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) {
      builder.can(AbilityAction.Manage, PostAuthZEntity);
      return this.buildAbility();
    }

    // 2. EMPLOYER — owns the posts created under its tenant (drafts included).
    if (user.type === ACCOUNT_TYPE_ENUMS.EMPLOYER) {
      builder.can(AbilityAction.Create, PostAuthZEntity, EMPLOYER_MUTATION_FIELDS);
      builder.can(AbilityAction.Read, PostAuthZEntity, ALL_POST_FIELDS, { tenantId });
      builder.can(AbilityAction.Update, PostAuthZEntity, EMPLOYER_MUTATION_FIELDS, { tenantId });
      builder.can(AbilityAction.SoftDelete, PostAuthZEntity, { tenantId });
      builder.can(AbilityAction.Restore, PostAuthZEntity, { tenantId });
      builder.can(AbilityAction.HardDelete, PostAuthZEntity, { tenantId });
    }

    // TODO: CANDIDATE create — own posts scoped by { jobProfileId } (not yet enabled).

    // 3. EVERYONE — public read of LIVE posts only, editorial fields stripped.
    builder.can(AbilityAction.Read, PostAuthZEntity, PUBLIC_READ_FIELDS, {
      status: POST_STATUS_ENUMS.LIVE,
    });

    return this.buildAbility();
  }

  private buildAbility(): AnyAbility {
    return this.abilityBuilder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
      fieldMatcher: fieldPatternMatcher,
    });
  }
}
