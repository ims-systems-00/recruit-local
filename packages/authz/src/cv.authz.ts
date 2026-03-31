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
  CV_STATUS_ENUM,
} from '@rl/types';

export class CvAuthZEntity {
  public readonly jobProfileId: string | null;
  public readonly status: CV_STATUS_ENUM;
  constructor({
    jobProfileId,
    status,
  }: {
    jobProfileId?: string | null;
    status?: CV_STATUS_ENUM;
  }) {
    this.jobProfileId = jobProfileId ?? null;
    this.status = status ?? CV_STATUS_ENUM.DRAFT;
  }
}

type ClaimAbility = PureAbility<AbilityTuple, MongoQuery<typeof CvAuthZEntity>>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class CvAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }

  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;

    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) {
      builder.can(AbilityAction.Manage, CvAuthZEntity);
    }

    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.CANDIDATE) {
      builder.can(AbilityAction.Create, CvAuthZEntity);
      builder.can(AbilityAction.Read, CvAuthZEntity);
      builder.can(AbilityAction.Update, CvAuthZEntity, {
        jobProfileId: this.session.tenantId,
      });
      builder.can(AbilityAction.SoftDelete, CvAuthZEntity, {
        jobProfileId: this.session.tenantId,
      });
    }

    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.EMPLOYER) {
      builder.can(AbilityAction.Read, CvAuthZEntity, {
        status: CV_STATUS_ENUM.PUBLISHED,
      });
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
    });
  }
}
