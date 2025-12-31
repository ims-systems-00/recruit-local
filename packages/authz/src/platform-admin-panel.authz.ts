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
} from '@inrm/types';

export class PlatformAdminPanelAuthZEntity {
  public readonly rootDashboardAllowed: boolean;
  public readonly management: boolean;
  constructor({
    rootDashboardAllowed = true,
    management = true,
  }: {
    rootDashboardAllowed?: boolean;
    management?: boolean;
  }) {
    this.rootDashboardAllowed = rootDashboardAllowed;
    this.management = management;
  }
}

type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof PlatformAdminPanelAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class PlatformAdminPanelAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }
  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;

    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) {
      builder.can(AbilityAction.Manage, PlatformAdminPanelAuthZEntity, {
        rootDashboardAllowed: true,
        management: true,
      });
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
    });
  }
}
