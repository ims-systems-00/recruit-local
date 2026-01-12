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

export class EventRegistrationAuthZEntity {
  public readonly candidateId: string | null;
  public readonly eventId: string | null;
  public readonly _id: string | null;

  constructor({
    candidateId,
    eventId,
    _id,
  }: {
    candidateId: string | null;
    eventId: string | null;
    _id: string | null;
  }) {
    this.candidateId = candidateId ?? null;
    this.eventId = eventId ?? null;
    this._id = _id ?? null;
  }
}

// 2. Define the Ability Types
type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof EventRegistrationAuthZEntity>
>;

const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

// 3. Define the Builder Class
export class EventRegistrationAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }

  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;
    const { user, tenantId } = this.session;

    if (user.type === ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) {
      builder.can(AbilityAction.Manage, EventRegistrationAuthZEntity);
      return builder.build({ conditionsMatcher: buildMongoQueryMatcher() });
    }

    if (user.type === ACCOUNT_TYPE_ENUMS.EMPLOYER && tenantId) {
    }

    if (user.type === ACCOUNT_TYPE_ENUMS.CANDIDATE) {
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
    });
  }
}
