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

export const ALL_STATUS_FIELDS = [
  '_id',
  'id',
  'createdAt',
  'updatedAt',
  'tenantId',
  'deleteMarker',
  'deleteMarker.*',
  'collectionName',
  'collectionId',
  'label',
  'weight',
  'default',
  'backgroundColor',
];

const EMPLOYER_CREATE_FIELDS = [
  'collectionName',
  'collectionId',
  'label',
  'weight',
  'default',
  'backgroundColor',
];

// Not `collectionName`/`collectionId`: moving a status onto another board would
// let it land on a board the tenant does not own.
const EMPLOYER_UPDATE_FIELDS = [
  'label',
  'weight',
  'default',
  'backgroundColor',
];

/**
 * A status has no owner of its own — it belongs to whatever it is attached to
 * (today, always a job). `tenantId` is copied from that parent when the status
 * is created, so these rules can scope on it like any tenant-owned entity.
 */
export class StatusAuthZEntity {
  public readonly tenantId: string | null;

  constructor({ tenantId }: { tenantId?: unknown }) {
    this.tenantId = tenantId ? String(tenantId) : null;
  }
}

type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof StatusAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class StatusAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }

  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;

    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) {
      builder.can(AbilityAction.Manage, StatusAuthZEntity);
    }

    if (
      this.session.user.type === ACCOUNT_TYPE_ENUMS.EMPLOYER &&
      this.session.tenantId
    ) {
      const tenantId = String(this.session.tenantId);

      builder.can(
        AbilityAction.Create,
        StatusAuthZEntity,
        EMPLOYER_CREATE_FIELDS,
        { tenantId },
      );
      builder.can(AbilityAction.Read, StatusAuthZEntity, ALL_STATUS_FIELDS, {
        tenantId,
      });
      builder.can(
        AbilityAction.Update,
        StatusAuthZEntity,
        EMPLOYER_UPDATE_FIELDS,
        { tenantId },
      );
      builder.can(AbilityAction.SoftDelete, StatusAuthZEntity, { tenantId });
      builder.can(AbilityAction.HardDelete, StatusAuthZEntity, { tenantId });
      builder.can(AbilityAction.Restore, StatusAuthZEntity, { tenantId });
    }

    // Candidates get nothing: they never call the status module. The status on
    // their application reaches them populated through the application itself.

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
      fieldMatcher: fieldPatternMatcher,
    });
  }
}
