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

export class UserAuthZEntity {
  public readonly tenantId: string | null;
  public readonly _id: string | null;
  constructor({
    tenantId,
    _id,
  }: {
    tenantId?: string | null;
    _id?: string | null;
  }) {
    this.tenantId = tenantId ?? null;
    this._id = _id ?? null;
  }
}

type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof UserAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class UserAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }

  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;

    if (this.session.user.type === USER_TYPE_ENUMS.CUSTOMER) {
      builder.can(AbilityAction.Read, UserAuthZEntity, {
        tenantId: this.session.tenantId,
      });
      builder.can(AbilityAction.Create, UserAuthZEntity, {
        tenantId: this.session.tenantId,
      });
      builder.can(AbilityAction.Update, UserAuthZEntity, {
        tenantId: this.session.tenantId,
      });
      builder.can(AbilityAction.Delete, UserAuthZEntity, {
        tenantId: this.session.tenantId,
      });
    }

    if (this.session.user.type === USER_TYPE_ENUMS.PLATFORM_ADMIN) {
      builder.can(AbilityAction.Manage, UserAuthZEntity);
    }

    if (this.session.user.type === USER_TYPE_ENUMS.AUDITOR) {
      builder.can(AbilityAction.Read, UserAuthZEntity);
      builder.can(AbilityAction.Update, UserAuthZEntity, {
        _id: this.session.user._id,
      });
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
    });
  }
}
