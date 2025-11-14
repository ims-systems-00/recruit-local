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
  COC_STATUS_ENUMS,
} from '@inrm/types';

export class CocRequestAuthZEntity {
  public readonly tenantId: string | null;
  public readonly status: COC_STATUS_ENUMS | null;
  constructor({
    tenantId,
    status,
  }: {
    tenantId?: string | null;
    status?: COC_STATUS_ENUMS;
  }) {
    this.tenantId = tenantId ?? null;
    this.status = status ?? null;
  }
}

type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof CocRequestAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class CocRequestAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }
  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;

    if (this.session.user.type === USER_TYPE_ENUMS.CUSTOMER) {
      builder.can(AbilityAction.Read, CocRequestAuthZEntity, {
        tenantId: this.session.tenantId,
      });
      builder.can(AbilityAction.Create, CocRequestAuthZEntity, {
        tenantId: this.session.tenantId,
      });
      builder.can(AbilityAction.Update, CocRequestAuthZEntity, {
        tenantId: this.session.tenantId,
      });
      builder.can(AbilityAction.Delete, CocRequestAuthZEntity, {
        tenantId: this.session.tenantId,
      });
    }

    if (this.session.user.type === USER_TYPE_ENUMS.PLATFORM_ADMIN) {
      builder.can(AbilityAction.Manage, CocRequestAuthZEntity);
    }

    if (
      this.session.user.type === USER_TYPE_ENUMS.PLATFORM_ADMIN ||
      this.session.user.type === USER_TYPE_ENUMS.CUSTOMER
    ) {
      builder.cannot(AbilityAction.Delete, CocRequestAuthZEntity, {
        status: COC_STATUS_ENUMS.REVIEW_COMPLETED,
      });

      builder.cannot(AbilityAction.Create, CocRequestAuthZEntity, {
        status: COC_STATUS_ENUMS.REVIEW_COMPLETED,
      });

      builder.cannot(AbilityAction.Update, CocRequestAuthZEntity, {
        status: COC_STATUS_ENUMS.REVIEW_COMPLETED,
      });
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
    });
  }
}
