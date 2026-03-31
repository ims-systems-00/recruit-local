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
  JOB_PROFILE_STATUS_ENUM,
} from '@rl/types';

export class JobProfileAuthZEntity {
  public readonly _id: string | null;
  public readonly status?: JOB_PROFILE_STATUS_ENUM;
  constructor({
    _id,
    status,
  }: {
    _id: string | null;
    status?: JOB_PROFILE_STATUS_ENUM;
  }) {
    this._id = _id ?? null;
    this.status = status;
  }
}

type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof JobProfileAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class JobProfileAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }
  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;

    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) {
      builder.can(AbilityAction.Manage, JobProfileAuthZEntity);
    }

    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.CANDIDATE) {
      builder.can(AbilityAction.Manage, JobProfileAuthZEntity, {
        _id: this.session.jobProfileId,
      });
    }

    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.EMPLOYER) {
      builder.can(AbilityAction.Manage, JobProfileAuthZEntity, {
        status: JOB_PROFILE_STATUS_ENUM.VERIFIED,
      });
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
    });
  }
}
