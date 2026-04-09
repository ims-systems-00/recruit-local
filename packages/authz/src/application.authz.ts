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

export const ALL_APPLICATION_FIELDS = [
  // --- Base & System Fields ---
  '_id',
  'id',
  'createdAt',
  'updatedAt',

  // --- Soft Delete Plugin ---
  'isDeleted',
  'deletedAt',

  // --- Boardable Plugin ---
  'status',
  'statusHistory',
  'boardOrder',

  // --- Job Profile Plugin (Assumed standard profile fields) ---
  'firstName',
  'lastName',
  'email',
  'phone',
  'address',
  'city',
  'country',
  'portfolio',
  'linkedin',
  'github',
  'experience',
  'education',
  'skills',
  'rank',

  // --- Core Application Fields ---
  'jobId',
  'coverLetter',
  'resumeId',
  'feedback',
  'appliedAt',
];

const omitFields = (fieldsToOmit: string[]) =>
  ALL_APPLICATION_FIELDS.filter((field) => !fieldsToOmit.includes(field));

const CANDIDATE_CREATE_FIELDS = [
  // Core candidate inputs
  'jobId',
  'coverLetter',
  'resumeStorage', // Used in creation payload

  // Job Profile inputs
  'firstName',
  'lastName',
  'email',
  'phone',
  'address',
  'city',
  'country',
  'portfolio',
  'linkedin',
  'github',
  'experience',
  'education',
  'skills',
];

const CANDIDATE_READ_FIELDS = omitFields([
  'isDeleted',
  'deletedAt',
  'feedback', // Feedback is internal from employer
  'rank', // Internal ranking metric
]);

const EMPLOYER_UPDATE_FIELDS = ['status', 'feedback', 'boardOrder'];

export class ApplicationAuthZEntity {
  public readonly tenantId: string | null;
  public readonly candidateId: string | null;

  constructor({
    tenantId,
    candidateId,
  }: {
    tenantId?: string | null;
    candidateId?: string | null;
  }) {
    // Note: tenantId is inherited from the Job this application belongs to.
    // In CASL subject evaluation, you will need to populate or pass the Job's tenantId
    // down to the Application AuthZ entity to verify employer ownership.
    this.tenantId = tenantId ?? null;

    // Assuming the user's ID is stored on the application (e.g., inside the job profile plugin or as a base field)
    // If you don't store candidate ID on applications (e.g. guest applications), you'll need to adjust this.
    this.candidateId = candidateId ?? null;
  }
}

type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof ApplicationAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class ApplicationAbilityBuilder implements IAbilityBuilder {
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
      builder.can(AbilityAction.Manage, ApplicationAuthZEntity);
    }

    // --- Employer ---
    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.EMPLOYER) {
      // Employers can read applications for their jobs
      builder.can(
        AbilityAction.Read,
        ApplicationAuthZEntity,
        ALL_APPLICATION_FIELDS,
        {
          tenantId: this.session.tenantId,
        },
      );

      // Employers can update specific fields (status, feedback, board placement)
      builder.can(
        AbilityAction.Update,
        ApplicationAuthZEntity,
        EMPLOYER_UPDATE_FIELDS,
        {
          tenantId: this.session.tenantId,
        },
      );

      // Employers can soft delete applications from their board
      builder.can(AbilityAction.SoftDelete, ApplicationAuthZEntity, {
        tenantId: this.session.tenantId,
      });

      builder.can(AbilityAction.Restore, ApplicationAuthZEntity, {
        tenantId: this.session.tenantId,
      });

      builder.can(AbilityAction.HardDelete, ApplicationAuthZEntity, {
        tenantId: this.session.tenantId,
      });
    }

    // --- Candidate ---
    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.CANDIDATE) {
      // Candidates can create applications
      builder.can(
        AbilityAction.Create,
        ApplicationAuthZEntity,
        CANDIDATE_CREATE_FIELDS,
      );

      // Candidates can read their OWN applications
      // (Requires the application to have the candidate's ID attached)
      builder.can(
        AbilityAction.Read,
        ApplicationAuthZEntity,
        CANDIDATE_READ_FIELDS,
        {
          candidateId: this.session.user._id,
        },
      );

      // Candidates might be able to withdraw (soft delete) their own application depending on your business logic
      builder.can(AbilityAction.SoftDelete, ApplicationAuthZEntity, {
        candidateId: this.session.user._id,
      });
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
      fieldMatcher: fieldPatternMatcher,
    });
  }
}
