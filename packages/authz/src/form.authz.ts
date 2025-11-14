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
  USER_TYPE_ENUMS,
  ISession,
  IAbilityBuilder,
  AbilityAction,
} from '@inrm/types';

export class FormAuthZEntity {
  public readonly tenantId: string | null;
  constructor({ tenantId }: { tenantId: string | null }) {
    this.tenantId = tenantId ?? null;
  }
}

type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof FormAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class FormAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }
  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;

    if (this.session.user.type === USER_TYPE_ENUMS.CUSTOMER) {
      // builder.can(AbilityAction.Manage, FormAuthZEntity);
    }

    if (this.session.user.type === USER_TYPE_ENUMS.PLATFORM_ADMIN) {
      builder.can(AbilityAction.Manage, FormAuthZEntity);
    }

    if (this.session.user.type === USER_TYPE_ENUMS.AUDITOR) {
      // builder.can(AbilityAction.Manage, FormAuthZEntity);
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
    });
  }
}
