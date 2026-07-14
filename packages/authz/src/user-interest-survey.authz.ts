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

export const ALL_USER_INTEREST_SURVEY_FIELDS = [
  '_id',
  'id',
  'createdAt',
  'updatedAt',
  'isDeleted',
  'deletedAt',
  'userId',
  'interest',
  'isSkipped',
];

export class UserInterestSurveyAuthZEntity {
  public readonly userId: string | null;

  constructor({ userId }: { userId?: string | null }) {
    this.userId = userId ?? null;
  }
}

type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof UserInterestSurveyAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class UserInterestSurveyAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }

  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;

    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) {
      builder.can(AbilityAction.Manage, UserInterestSurveyAuthZEntity);
      return this.buildAbility();
    }

    if (
      this.session.user.type === ACCOUNT_TYPE_ENUMS.EMPLOYER ||
      this.session.user.type === ACCOUNT_TYPE_ENUMS.CANDIDATE
    ) {
      const currentUserId = this.session.user._id;

      if (currentUserId) {
        builder.can(
          AbilityAction.Read,
          UserInterestSurveyAuthZEntity,
          ALL_USER_INTEREST_SURVEY_FIELDS,
          { userId: currentUserId },
        );

        builder.can(AbilityAction.Create, UserInterestSurveyAuthZEntity, [
          'interest',
          'isSkipped',
        ]);

        builder.can(
          AbilityAction.Update,
          UserInterestSurveyAuthZEntity,
          ['interest', 'isSkipped'],
          { userId: currentUserId },
        );

        builder.can(AbilityAction.SoftDelete, UserInterestSurveyAuthZEntity, {
          userId: currentUserId,
        });

        builder.can(AbilityAction.HardDelete, UserInterestSurveyAuthZEntity, {
          userId: currentUserId,
        });

        builder.can(AbilityAction.Restore, UserInterestSurveyAuthZEntity, {
          userId: currentUserId,
        });
      }
    }

    return this.buildAbility();
  }

  private buildAbility(): AnyAbility {
    return this.abilityBuilder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
      fieldMatcher: fieldPatternMatcher,
    });
  }
}
