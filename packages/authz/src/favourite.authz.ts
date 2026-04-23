import {
  AbilityBuilder,
  AbilityClass,
  AbilityTuple,
  AnyAbility,
  PureAbility,
  buildMongoQueryMatcher,
  MongoQuery,
  fieldPatternMatcher,
} from '@casl/ability';

import {
  ACCOUNT_TYPE_ENUMS,
  ISession,
  IAbilityBuilder,
  AbilityAction,
} from '@rl/types';

export const ALL_FAVOURITE_FIELDS = [
  // --- Base & System Fields ---
  '_id',
  'id',
  'createdAt',
  'updatedAt',

  // --- Soft Delete Plugin (ISoftDeleteDoc) ---
  'isDeleted',
  'deletedAt',
  'deleteMarker.status', // Used in your partialFilterExpression

  // --- Core Favourite Fields ---
  'userId',
  'itemId',
  'itemType',

  // --- Populated Objects (Optional/Future-proofing) ---
  'item',
  'item.*',
  'user',
  'user.*',
];

const USER_CREATE_FIELDS = ['userId', 'itemId', 'itemType'];

export class FavouriteAuthZEntity {
  public readonly userId: string | null;

  constructor({ userId }: { userId?: string | null }) {
    this.userId = userId ?? null;
  }
}

type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof FavouriteAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class FavouriteAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }

  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;

    // --- Platform Admin ---
    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) {
      builder.can(AbilityAction.Manage, FavouriteAuthZEntity);
      return builder.build({
        conditionsMatcher: buildMongoQueryMatcher(),
        fieldMatcher: fieldPatternMatcher,
      });
    }

    // --- Authenticated Users (Employers & Candidates) ---
    // Assuming session.user.id holds the user's ObjectId string.
    // Adjust to `this.session.userId` if that is how your ISession is typed.
    const currentUserId = this.session.user._id;

    if (currentUserId) {
      // Users can create a favourite
      builder.can(
        AbilityAction.Create,
        FavouriteAuthZEntity,
        USER_CREATE_FIELDS,
      );

      // Users can read their OWN favourites
      builder.can(
        AbilityAction.Read,
        FavouriteAuthZEntity,
        ALL_FAVOURITE_FIELDS,
        {
          userId: currentUserId,
        },
      );

      // Users generally don't "update" favourites (they just toggle them on/off),
      // but if you add metadata fields later, add a builder.can(AbilityAction.Update, ...) here.

      // Users can soft delete their own favourites
      builder.can(AbilityAction.SoftDelete, FavouriteAuthZEntity, {
        userId: currentUserId,
      });

      // Users can restore their own favourites
      builder.can(AbilityAction.Restore, FavouriteAuthZEntity, {
        userId: currentUserId,
      });

      // Users can hard delete their own favourites
      builder.can(AbilityAction.HardDelete, FavouriteAuthZEntity, {
        userId: currentUserId,
      });
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
      fieldMatcher: fieldPatternMatcher,
    });
  }
}
