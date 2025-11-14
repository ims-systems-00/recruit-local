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
  AUDIT_STATUS_ENUMS,
} from '@inrm/types';

export class AuditAuthZEntity {
  public readonly tenantId: string | null;
  public readonly status: AUDIT_STATUS_ENUMS | null;
  public readonly leadAuditor: string | null;
  public readonly subAuditors: string[] | null;
  constructor({
    tenantId,
    status,
    leadAuditor,
    subAuditors,
  }: {
    tenantId?: string | null;
    status?: AUDIT_STATUS_ENUMS | null;
    leadAuditor?: string | null;
    subAuditors?: string[] | null;
  }) {
    this.tenantId = tenantId ?? null;
    this.status = status ?? null;
    this.leadAuditor = leadAuditor ?? null;
    this.subAuditors = subAuditors ?? null;
  }
}

type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof AuditAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class AuditAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }
  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;

    if (this.session.user.type === USER_TYPE_ENUMS.AUDITOR) {
      builder.can(AbilityAction.Read, AuditAuthZEntity, {
        $or: [
          { leadAuditor: this.session.user._id },
          {
            subAuditors: this.session.user._id,
          },
        ],
      } as MongoQuery<AuditAuthZEntity>);
      builder.can(AbilityAction.Update, AuditAuthZEntity, {
        $or: [
          { leadAuditor: this.session.user._id },
          {
            subAuditors: this.session.user._id,
          },
        ],
      } as MongoQuery<AuditAuthZEntity>);
    }

    if (this.session.user.type === USER_TYPE_ENUMS.PLATFORM_ADMIN) {
      builder.can(AbilityAction.Manage, AuditAuthZEntity);
    }

    if (this.session.user.type === USER_TYPE_ENUMS.CUSTOMER) {
      builder.can(AbilityAction.Read, AuditAuthZEntity, {
        tenantId: this.session.tenantId,
      });
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
    });
  }
}
