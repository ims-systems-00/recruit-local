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
  JOBS_STATUS_ENUMS,
} from '@rl/types';

export class JobAuthZEntity {
  public readonly tenantId: string | null;
  public readonly status: JOBS_STATUS_ENUMS;
  constructor({
    tenantId,
    status,
  }: {
    tenantId?: string | null;
    status?: JOBS_STATUS_ENUMS;
  }) {
    this.tenantId = tenantId ?? null;
    this.status = status ?? JOBS_STATUS_ENUMS.DRAFT;
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

    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) {
      builder.can(AbilityAction.Manage, JobAuthZEntity);
    }

    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.EMPLOYER) {
      builder.can(AbilityAction.Create, JobAuthZEntity);
      builder.can(AbilityAction.Read, JobAuthZEntity);
      builder.can(AbilityAction.Update, JobAuthZEntity, {
        tenantId: this.session.tenantId,
      });
      builder.can(AbilityAction.SoftDelete, JobAuthZEntity, {
        tenantId: this.session.tenantId,
      });
    }

    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.CANDIDATE) {
      builder.can(AbilityAction.Read, JobAuthZEntity, {
        status: JOBS_STATUS_ENUMS.OPEN,
      });
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
    });
  }
}
