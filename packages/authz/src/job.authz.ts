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

export class JobAuthZEntity {
  public readonly tenantId: string | null;
  constructor({ tenantId }: { tenantId?: string | null }) {
    this.tenantId = tenantId ?? null;
  }
}

type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof JobAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class JobAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }

  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;

    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.EMPLOYER) {
      builder.can(AbilityAction.Manage, JobAuthZEntity, {
        tenantId: this.session.tenantId,
      });
    }

    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) {
      builder.can(AbilityAction.Read, JobAuthZEntity);
    }

    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.CANDIDATE) {
      builder.can(AbilityAction.Read, JobAuthZEntity);
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
    });
  }
}
