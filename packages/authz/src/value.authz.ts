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

export const ALL_VALUE_FIELDS = [
  '_id',
  'id',
  'createdAt',
  'updatedAt',
  'isDeleted',
  'deletedAt',
  'type',
  'label',
  'isActive',
  'weight',
];

export class ValueAuthZEntity {
  public readonly _id: string | null;
  constructor({ _id }: { _id?: string | null }) {
    this._id = _id ?? null;
  }
}

type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof ValueAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class ValueAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }

  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;

    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) {
      builder.can(AbilityAction.Manage, ValueAuthZEntity);
    } else {
      builder.can(AbilityAction.Read, ValueAuthZEntity);
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
    });
  }
}
