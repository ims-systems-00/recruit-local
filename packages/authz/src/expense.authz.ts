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

export class ExpenseAuthZEntity {
  constructor() {}
}

type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof ExpenseAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class ExpenseAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }
  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;

    // if (this.session.user.type === USER_TYPE_ENUMS.PLATFORM_ADMIN) {
    //   builder.can(AbilityAction.Manage, ExpenseAuthZEntity);
    // }

    // if (this.session.user.type === USER_TYPE_ENUMS.CUSTOMER) {
    //   builder.cannot(AbilityAction.Manage, ExpenseAuthZEntity);
    // }

    // if (this.session.user.type === USER_TYPE_ENUMS.AUDITOR) {
    //   builder.can(AbilityAction.Manage, ExpenseAuthZEntity);
    // }

    builder.cannot(AbilityAction.Manage, ExpenseAuthZEntity);

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
    });
  }
}
