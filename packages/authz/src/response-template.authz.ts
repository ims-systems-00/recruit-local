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
} from '@rl/types';

export class ResponseTemplateAuthZEntity {
  // tenantId removed since it's no longer needed
}

type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof ResponseTemplateAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class ResponseTemplateAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }

  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;

    switch (this.session.user.type) {
      case ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN:
        builder.can(AbilityAction.Manage, ResponseTemplateAuthZEntity);
        break;
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
    });
  }
}
