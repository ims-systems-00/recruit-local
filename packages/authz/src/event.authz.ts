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
} from '@rl/types';

export class EventAuthZEntity {
  public readonly organizers: string[] | null;
  public readonly _id: string | null;
  constructor({
    organizers,
    _id,
  }: {
    organizers: string[] | null;
    _id: string | null;
  }) {
    this.organizers = organizers ?? null;
    this._id = _id ?? null;
  }
}

type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof EventAuthZEntity>
>;

const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class EventAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }

  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;
    const { user, tenantId } = this.session;

    // --- Platform Admin: Manage Everything ---
    if (user.type === ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) {
      builder.can(AbilityAction.Manage, EventAuthZEntity);
      return builder.build({ conditionsMatcher: buildMongoQueryMatcher() });
    }

    // --- Tenant Admin/Employer ---
    if (user.type === ACCOUNT_TYPE_ENUMS.EMPLOYER && tenantId) {
      // THE KEY LOGIC:
      // Allow management IF the user's tenantId exists inside the Event's 'organizers' array.
      // CASL's Mongo matcher handles array membership automatically.
      builder.can(AbilityAction.Manage, EventAuthZEntity, {
        organizers: tenantId,
      });

      // Optional: If you want regular employees to Read but not Update
      if (user.role !== USER_ROLE_ENUMS.ADMIN) {
        // You might restrict this, but keeping it simple for now:
        // If they are part of the organizing tenant, they can read.
        builder.can(AbilityAction.Read, EventAuthZEntity, {
          organizers: tenantId,
        });
      }
    }

    // --- Candidates / Public Users ---
    // (Define logic for non-tenants here, e.g., read only if status is Published)

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
    });
  }
}
