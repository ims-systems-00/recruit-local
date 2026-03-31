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
  JOB_PROFILE_STATUS_ENUM,
  VISIBILITY,
} from '@rl/types';

export const ALL_JOB_PROFILE_FIELDS = [
  '_id',
  'userId',
  'headline',
  'summary',
  'keywords',
  'languages',
  'visibility',
  'status',
  'kycDocumentId',
  'createdAt',
  'updatedAt',
];

const EMPLOYER_EXCLUDED_FIELDS = ['kycDocumentId', 'status', 'visibility'];

const EMPLOYER_ALLOWED_FIELDS = ALL_JOB_PROFILE_FIELDS.filter(
  (field) => !EMPLOYER_EXCLUDED_FIELDS.includes(field),
);

export class JobProfileAuthZEntity {
  public readonly _id: string | null;
  public readonly status?: JOB_PROFILE_STATUS_ENUM;
  public visibility?: VISIBILITY;
  constructor({
    _id,
    status,
    visibility,
  }: {
    _id: string | null;
    status?: JOB_PROFILE_STATUS_ENUM;
    visibility?: VISIBILITY;
  }) {
    this._id = _id ?? null;
    this.status = status;
    this.visibility = visibility;
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
      builder.can(
        AbilityAction.Read,
        JobProfileAuthZEntity,
        EMPLOYER_ALLOWED_FIELDS,
        {
          status: JOB_PROFILE_STATUS_ENUM.VERIFIED,
          visibility: VISIBILITY.PUBLIC,
        },
      );
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
      fieldMatcher: fieldPatternMatcher,
    });
  }
}
