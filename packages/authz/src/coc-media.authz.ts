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
  MEDIA_APPROVAL_STATUS_ENUMS,
} from '@inrm/types';

export class CocMediaAuthZEntity {
  public readonly tenantId: string | null;
  public readonly status: MEDIA_APPROVAL_STATUS_ENUMS | null;
  constructor({
    tenantId,
    status,
  }: {
    tenantId?: string | null;
    status?: MEDIA_APPROVAL_STATUS_ENUMS | null;
  }) {
    this.tenantId = tenantId ?? null;
    this.status = status ?? null;
  }
}

type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof CocMediaAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class CocMediaAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }
  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;

    if (this.session.user.type === USER_TYPE_ENUMS.CUSTOMER) {
      builder.can(AbilityAction.Create, CocMediaAuthZEntity);
      builder.can(AbilityAction.Read, CocMediaAuthZEntity);
      builder.can(AbilityAction.Update, CocMediaAuthZEntity, {
        tenantId: this.session.tenantId,
      });
      builder.can(AbilityAction.Delete, CocMediaAuthZEntity, {
        tenantId: this.session.tenantId,
      });

      builder.cannot(AbilityAction.Create, CocMediaAuthZEntity, {
        status: { $ne: MEDIA_APPROVAL_STATUS_ENUMS.PENDING },
      });

      builder.cannot(AbilityAction.Update, CocMediaAuthZEntity, {
        status: { $ne: MEDIA_APPROVAL_STATUS_ENUMS.PENDING },
      });

      builder.cannot(AbilityAction.Delete, CocMediaAuthZEntity, {
        status: { $ne: MEDIA_APPROVAL_STATUS_ENUMS.PENDING },
      });
    }

    if (this.session.user.type === USER_TYPE_ENUMS.PLATFORM_ADMIN) {
      builder.can(AbilityAction.Manage, CocMediaAuthZEntity);
    }

    if (this.session.user.type === USER_TYPE_ENUMS.AUDITOR) {
      builder.cannot(AbilityAction.Manage, CocMediaAuthZEntity);
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
    });
  }
}
