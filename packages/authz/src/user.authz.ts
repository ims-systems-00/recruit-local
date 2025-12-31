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
  USER_ROLE_ENUMS,
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

    // admin can manage all
    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) {
      builder.can(AbilityAction.Manage, UserAuthZEntity);
    }

    // tenant admin can manage users within their tenant
    if (
      this.session.user.type === ACCOUNT_TYPE_ENUMS.EMPLOYER &&
      this.session.user.role === USER_ROLE_ENUMS.ADMIN
    ) {
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

    // employer can read only their own user if not admin
    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.EMPLOYER) {
      builder.can(AbilityAction.Read, UserAuthZEntity, {
        tenantId: this.session.tenantId,
        _id: this.session.user._id,
      });
    }

    // candidate can read only their own user
    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.CANDIDATE) {
      builder.can(AbilityAction.Read, UserAuthZEntity, {
        _id: this.session.user._id,
      });
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
    });
  }
}
