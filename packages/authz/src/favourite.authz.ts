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

export const ALL_FAVOURITE_FIELDS = [
  // --- Base & System Fields ---
  '_id',
  'id',
  'createdAt',
  'updatedAt',

  // --- Soft Delete Plugin (ISoftDeleteDoc) ---
  'isDeleted',
  'deletedAt',
  'deleteMarker.status', // Used in your partialFilterExpression

  // --- Core Favourite Fields ---
  'tenantId',
  'jobProfileId',
  'itemId',
  'itemType',

  // --- Populated Objects (Optional/Future-proofing) ---
  'item',
  'item.*',
  'user',
  'user.*',
];

const CREATE_FIELDS = ['tenantId', 'jobProfileId', 'itemId', 'itemType'];

const UPDATE_FIELDS = ['tenantId', 'jobProfileId', 'itemType'];

export class FavouriteAuthZEntity {
  public readonly tenantId: string | null | undefined;
  public readonly jobProfileId: string | null;
  public readonly itemId: string | null;
  public readonly itemType: string | null;

  constructor({
    tenantId,
    jobProfileId,
    itemId,
    itemType,
  }: {
    tenantId?: string | null;
    jobProfileId?: string | null;
    itemId?: string | null;
    itemType?: string | null;
  }) {
    this.tenantId = tenantId ?? null;
    this.jobProfileId = jobProfileId ?? null;
    this.itemId = itemId ?? null;
    this.itemType = itemType ?? null;
  }
}

type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof FavouriteAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class FavouriteAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }

  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;

    // --- Platform Admin ---
    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) {
      builder.can(AbilityAction.Manage, FavouriteAuthZEntity);
      return builder.build({
        conditionsMatcher: buildMongoQueryMatcher(),
        fieldMatcher: fieldPatternMatcher,
      });
    }

    // --- Employer: Can create with tenantId ---
    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.EMPLOYER) {
      const currentTenantId = this.session.tenantId;

      if (currentTenantId) {
        builder.can(AbilityAction.Create, FavouriteAuthZEntity, CREATE_FIELDS);

        builder.can(
          AbilityAction.Read,
          FavouriteAuthZEntity,
          ALL_FAVOURITE_FIELDS,
          { tenantId: currentTenantId },
        );

        builder.can(AbilityAction.Update, FavouriteAuthZEntity, UPDATE_FIELDS, {
          tenantId: currentTenantId,
        });

        builder.can(AbilityAction.SoftDelete, FavouriteAuthZEntity, {
          tenantId: currentTenantId,
        });

        builder.can(AbilityAction.Restore, FavouriteAuthZEntity, {
          tenantId: currentTenantId,
        });

        builder.can(AbilityAction.HardDelete, FavouriteAuthZEntity, {
          tenantId: currentTenantId,
        });
      }

      return builder.build({
        conditionsMatcher: buildMongoQueryMatcher(),
        fieldMatcher: fieldPatternMatcher,
      });
    }

    // --- Candidate: Can create with jobProfileId ---
    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.CANDIDATE) {
      const currentJobProfileId = this.session.jobProfileId;

      if (currentJobProfileId) {
        builder.can(AbilityAction.Create, FavouriteAuthZEntity, CREATE_FIELDS);

        builder.can(
          AbilityAction.Read,
          FavouriteAuthZEntity,
          ALL_FAVOURITE_FIELDS,
          { jobProfileId: currentJobProfileId },
        );

        builder.can(AbilityAction.Update, FavouriteAuthZEntity, UPDATE_FIELDS, {
          jobProfileId: currentJobProfileId,
        });

        builder.can(AbilityAction.SoftDelete, FavouriteAuthZEntity, {
          jobProfileId: currentJobProfileId,
        });

        builder.can(AbilityAction.Restore, FavouriteAuthZEntity, {
          jobProfileId: currentJobProfileId,
        });

        builder.can(AbilityAction.HardDelete, FavouriteAuthZEntity, {
          jobProfileId: currentJobProfileId,
        });
      }

      return builder.build({
        conditionsMatcher: buildMongoQueryMatcher(),
        fieldMatcher: fieldPatternMatcher,
      });
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
      fieldMatcher: fieldPatternMatcher,
    });
  }
}
