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
} from '@rl/types';

export class JobProfileAuthZEntity {
  public readonly _id: string | null;
  constructor({ _id }: { _id: string | null }) {
    this._id = _id ?? null;
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

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
    });
  }
}
