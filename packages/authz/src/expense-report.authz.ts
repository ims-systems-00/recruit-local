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
  EXPENSE_REPORT_STATUS_ENUMS,
} from '@inrm/types';

export class ExpenseReportAuthZEntity {
  public readonly tenantId: string | null;
  public readonly status: EXPENSE_REPORT_STATUS_ENUMS | null;
  constructor({
    tenantId,
    status,
  }: {
    tenantId?: string | null;
    status?: EXPENSE_REPORT_STATUS_ENUMS | null;
  }) {
    this.tenantId = tenantId ?? null;
    this.status = status ?? null;
  }
}

type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof ExpenseReportAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class ExpenseReportAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }
  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;

    // if (this.session.user.type === USER_TYPE_ENUMS.PLATFORM_ADMIN) {
    //   builder.can(AbilityAction.Manage, ExpenseReportAuthZEntity);
    //   builder.cannot(AbilityAction.Update, ExpenseReportAuthZEntity, {
    //     status: {
    //       $in: [
    //         EXPENSE_REPORT_STATUS_ENUMS.APPROVED,
    //         EXPENSE_REPORT_STATUS_ENUMS.REJECTED,
    //       ],
    //     },
    //   });
    //   builder.cannot(
    //     AbilityAction.MARK_AS_IN_REVIEW,
    //     ExpenseReportAuthZEntity,
    //     {
    //       status: { $ne: EXPENSE_REPORT_STATUS_ENUMS.SUBMITTED },
    //     },
    //   );
    //   builder.cannot(
    //     AbilityAction.REMOVE_FROM_REVIEW,
    //     ExpenseReportAuthZEntity,
    //     {
    //       status: { $ne: EXPENSE_REPORT_STATUS_ENUMS.IN_REVIEW },
    //     },
    //   );
    // }

    // if (this.session.user.type === USER_TYPE_ENUMS.CUSTOMER) {
    //   builder.cannot(AbilityAction.Manage, ExpenseReportAuthZEntity);
    // }

    // if (this.session.user.type === USER_TYPE_ENUMS.AUDITOR) {
    //   builder.can(AbilityAction.Read, ExpenseReportAuthZEntity);
    //   builder.can(AbilityAction.Create, ExpenseReportAuthZEntity);
    //   builder.can(AbilityAction.Update, ExpenseReportAuthZEntity, {
    //     status: {
    //       $in: [
    //         EXPENSE_REPORT_STATUS_ENUMS.DRAFT,
    //         EXPENSE_REPORT_STATUS_ENUMS.SUBMITTED,
    //       ],
    //     },
    //   });
    //   builder.can(AbilityAction.Delete, ExpenseReportAuthZEntity, {
    //     status: {
    //       $in: [
    //         EXPENSE_REPORT_STATUS_ENUMS.DRAFT,
    //         EXPENSE_REPORT_STATUS_ENUMS.SUBMITTED,
    //       ],
    //     },
    //   });
    // }

    builder.cannot(AbilityAction.Manage, ExpenseReportAuthZEntity);

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
    });
  }
}
