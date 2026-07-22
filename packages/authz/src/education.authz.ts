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

export const ALL_EDUCATION_FIELDS = [
  // --- Base & System Fields ---
  '_id',
  'id',
  'createdAt',
  'updatedAt',

  // --- Soft Delete Plugin (ISoftDeleteDoc) ---
  'isDeleted',
  'deletedAt',

  // --- Ownership (userOwnedPlugin & jobProfilePlugin) ---
  'userId',
  'jobProfileId',

  // --- Core Education Fields (IEducation) ---
  'institution',
  'degree',
  'fieldOfStudy',
  'startDate',
  'endDate',
  'description',
  'grade',
];

const omitFields = (fieldsToOmit: string[]) =>
  ALL_EDUCATION_FIELDS.filter((field) => !fieldsToOmit.includes(field));

const CANDIDATE_CREATE_FIELDS = [
  'jobProfileId',
  'institution',
  'degree',
  'fieldOfStudy',
  'startDate',
  'endDate',
  'description',
  'grade',
];

const CANDIDATE_UPDATE_FIELDS = [
  'institution',
  'degree',
  'fieldOfStudy',
  'startDate',
  'endDate',
  'description',
  'grade',
];

const READ_FIELDS = omitFields(['isDeleted', 'deletedAt']);

export class EducationAuthZEntity {
  public readonly userId: string | null;
  public readonly jobProfileId: string | null;

  constructor({
    userId,
    jobProfileId,
  }: {
    userId?: string | null;
    jobProfileId?: string | null;
  }) {
    this.userId = userId ?? null;
    this.jobProfileId = jobProfileId ?? null;
  }
}

type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof EducationAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class EducationAbilityBuilder implements IAbilityBuilder {
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
      builder.can(AbilityAction.Manage, EducationAuthZEntity);
    }

    // --- Candidate (owns their education records via jobProfileId) ---
    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.CANDIDATE) {
      builder.can(
        AbilityAction.Create,
        EducationAuthZEntity,
        CANDIDATE_CREATE_FIELDS,
      );

      builder.can(AbilityAction.Read, EducationAuthZEntity, READ_FIELDS, {
        jobProfileId: this.session.jobProfileId,
      });

      builder.can(
        AbilityAction.Update,
        EducationAuthZEntity,
        CANDIDATE_UPDATE_FIELDS,
        {
          jobProfileId: this.session.jobProfileId,
        },
      );

      builder.can(AbilityAction.SoftDelete, EducationAuthZEntity, {
        jobProfileId: this.session.jobProfileId,
      });

      builder.can(AbilityAction.Restore, EducationAuthZEntity, {
        jobProfileId: this.session.jobProfileId,
      });

      builder.can(AbilityAction.HardDelete, EducationAuthZEntity, {
        jobProfileId: this.session.jobProfileId,
      });
    }

    // --- Employer (can read candidate education on their profiles) ---
    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.EMPLOYER) {
      builder.can(AbilityAction.Read, EducationAuthZEntity, READ_FIELDS);
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
      fieldMatcher: fieldPatternMatcher,
    });
  }
}
