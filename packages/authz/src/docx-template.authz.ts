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

export class DocxTemplateAuthZEntity {}

type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof DocxTemplateAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class DocxTemplateAbilityBuilder implements IAbilityBuilder {
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
        builder.can(AbilityAction.Manage, DocxTemplateAuthZEntity);
        break;
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
    });
  }
}
