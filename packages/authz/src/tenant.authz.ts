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

    if (this.session.user.type === USER_TYPE_ENUMS.CUSTOMER) {
      builder.can(AbilityAction.Read, TenantAuthZEntity, {
        _id: this.session.tenantId,
      });
      builder.can(AbilityAction.Update, TenantAuthZEntity, {
        _id: this.session.tenantId,
      });
    }

    if (this.session.user.type === USER_TYPE_ENUMS.PLATFORM_ADMIN) {
      builder.can(AbilityAction.Manage, TenantAuthZEntity);
    }

    if (this.session.user.type === USER_TYPE_ENUMS.AUDITOR) {
      // builder.can(AbilityAction.Manage, TenantAuthZEntity);
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
    });
  }
}
