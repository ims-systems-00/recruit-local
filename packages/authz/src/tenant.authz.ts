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

export const ALL_TENANT_FIELDS = [
  // --- Base & System Fields ---
  '_id',
  'id',
  'createdAt',
  'updatedAt',

  // --- Core Tenant Fields (TenantInput) ---
  'name',
  'description',
  'industry',
  'type',
  'size',
  'phone',
  'email',
  'logoSquareSrc',
  'logoSquareStorage',
  'logoSquareStorage.*',
  'logoRectangleSrc',
  'logoRectangleStorage',
  'logoRectangleStorage.*',
  'officeAddress',
  'addressInMap',
  'addressInMapLat',
  'addressInMapLng',
  'status',
  'website',
  'linkedIn',
  'missionStatement',
  'visionStatement',
  'coreProducts',
  'coreServices',
  'values',
  'onboardingStep',
  'isRecruitmentEnabled',
];

export class TenantAuthZEntity {
  public readonly _id: string | null;
  constructor({ _id }: { _id: string | null }) {
    this._id = _id ?? null;
  }
}

type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof TenantAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class TenantAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }
  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;

    // Every account type can read all fields of organisations (e.g. to view an organisation's values).
    builder.can(AbilityAction.Read, TenantAuthZEntity, ALL_TENANT_FIELDS);

    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) {
      builder.can(AbilityAction.Manage, TenantAuthZEntity, ALL_TENANT_FIELDS);
    }

    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.EMPLOYER) {
      builder.can(AbilityAction.Manage, TenantAuthZEntity, ALL_TENANT_FIELDS, {
        _id: this.session.tenantId,
      });
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
      fieldMatcher: fieldPatternMatcher,
    });
  }
}
