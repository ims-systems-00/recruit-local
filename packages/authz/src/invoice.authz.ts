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

export class InvoiceAuthZEntity {}

type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof InvoiceAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class InvoiceAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }

  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;

    switch (this.session.user.type) {
      case USER_TYPE_ENUMS.PLATFORM_ADMIN:
        builder.cannot(AbilityAction.Manage, InvoiceAuthZEntity);
        break;
      case USER_TYPE_ENUMS.CUSTOMER:
        builder.cannot(AbilityAction.Manage, InvoiceAuthZEntity);
        break;
      case USER_TYPE_ENUMS.AUDITOR:
        builder.cannot(AbilityAction.Manage, InvoiceAuthZEntity);
        break;
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
    });
  }
}
