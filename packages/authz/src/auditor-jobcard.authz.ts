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

export class AuditorJobCardAuthZEntity {
  public readonly leadAuditor: string | null;
  public readonly subAuditors: string[] | null;
  constructor({
    leadAuditor,
    subAuditors,
  }: {
    leadAuditor?: string | null;
    subAuditors?: string[] | null;
  }) {
    this.leadAuditor = leadAuditor ?? null;
    this.subAuditors = subAuditors ?? null;
  }
}

type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof AuditorJobCardAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class AuditorJobCardAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }
  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;

    switch (this.session.user.type) {
      case USER_TYPE_ENUMS.AUDITOR:
        builder.can(AbilityAction.Read, AuditorJobCardAuthZEntity, {
          $or: [
            { leadAuditor: this.session.user._id },
            { subAuditors: this.session.user._id },
          ],
        } as MongoQuery<AuditorJobCardAuthZEntity>);
        builder.can(AbilityAction.Update, AuditorJobCardAuthZEntity, {
          $or: [
            { leadAuditor: this.session.user._id },
            { subAuditors: this.session.user._id },
          ],
        } as MongoQuery<AuditorJobCardAuthZEntity>);
        break;
      case USER_TYPE_ENUMS.PLATFORM_ADMIN:
        builder.can(AbilityAction.Manage, AuditorJobCardAuthZEntity);
        break;
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
    });
  }
}
