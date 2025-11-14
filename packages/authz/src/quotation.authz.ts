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
  QUOTATION_STATUS_ENUMS,
} from '@inrm/types';

export class QuotationAuthZEntity {
  public readonly tenantId: string | null;
  public readonly status: QUOTATION_STATUS_ENUMS | null;
  constructor({
    tenantId,
    status,
  }: {
    tenantId?: string | null;
    status?: QUOTATION_STATUS_ENUMS | null;
  }) {
    this.tenantId = tenantId ?? null;
    this.status = status ?? null;
  }
}

type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof QuotationAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class QuotationAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }
  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;

    if (this.session.user.type === USER_TYPE_ENUMS.PLATFORM_ADMIN) {
      builder.can(AbilityAction.Manage, QuotationAuthZEntity);
      builder.can(AbilityAction.Send, QuotationAuthZEntity);
      builder.can(AbilityAction.Approval, QuotationAuthZEntity);
      builder.cannot(AbilityAction.Update, QuotationAuthZEntity, {
        status: {
          $in: [
            QUOTATION_STATUS_ENUMS.APPROVED,
            QUOTATION_STATUS_ENUMS.REJECTED,
          ],
        },
      });
    }

    if (this.session.user.type === USER_TYPE_ENUMS.CUSTOMER) {
      builder.can(AbilityAction.Read, QuotationAuthZEntity);
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
    });
  }
}
