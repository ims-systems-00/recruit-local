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
  KYC_STATUS,
} from '@rl/types';

export const ALL_KYC_FIELDS = [
  '_id',
  'id',
  'createdAt',
  'updatedAt',
  'isDeleted',
  'deletedAt',
  'userId',
  'firstName',
  'lastName',
  'dateOfBirth',
  'status',
  'documentType',
  'documentFrontId',
  'documentBackId',
  'documentFront',
  'documentFront.*',
  'documentBack',
  'documentBack.*',
  'documentFrontStorage',
  'documentFrontStorage.*',
  'documentBackStorage',
  'documentBackStorage.*',
  'rejectionReason',
];

const CANDIDATE_CREATE_FIELDS = [
  'firstName',
  'lastName',
  'dateOfBirth',
  'documentType',
  'documentFrontStorage',
  'documentFrontStorage.*',
  'documentBackStorage',
  'documentBackStorage.*',
];

const CANDIDATE_UPDATE_FIELDS = [
  'firstName',
  'lastName',
  'dateOfBirth',
  'documentType',
  'documentFrontStorage',
  'documentFrontStorage.*',
  'documentBackStorage',
  'documentBackStorage.*',
];

export class KycAuthZEntity {
  public readonly userId: string | null;
  public readonly status: KYC_STATUS;

  constructor({
    userId,
    status,
  }: {
    userId?: string | null;
    status?: KYC_STATUS;
  }) {
    this.userId = userId ?? null;
    this.status = status ?? KYC_STATUS.PENDING;
  }
}

type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof KycAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class KycAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }

  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;

    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) {
      builder.can(AbilityAction.Manage, KycAuthZEntity);
      return this.buildAbility();
    }

    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.CANDIDATE) {
      const currentUserId = this.session.user._id;

      if (currentUserId) {
        builder.can(AbilityAction.Read, KycAuthZEntity, ALL_KYC_FIELDS, {
          userId: currentUserId,
        });
        builder.can(
          AbilityAction.Create,
          KycAuthZEntity,
          CANDIDATE_CREATE_FIELDS,
        );
        builder.can(
          AbilityAction.Update,
          KycAuthZEntity,
          CANDIDATE_UPDATE_FIELDS,
          {
            userId: currentUserId,
            status: {
              $in: [
                KYC_STATUS.PENDING,
                KYC_STATUS.ACTION_REQUIRED,
                KYC_STATUS.REJECTED,
              ],
            },
          },
        );
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
