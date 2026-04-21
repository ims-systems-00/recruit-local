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

  // --- Soft Delete Plugin (ISoftDeleteDoc) ---
  'isDeleted',
  'deletedAt',

  // --- Boardable Plugin (IBoardableInput & Model) ---
  'statusId',
  'rank',

  // --- Job Profile Plugin (JobProfileInput) ---
  'jobProfileId',

  // --- Core Application Fields (ApplicationInput) ---
  'jobId',
  'coverLetter',
  'resumeId',
  'caseStudyId',
  'answers',
  'portfolioUrl',
  'currentSalary',
  'expectedSalary',
  'feedback',
  'appliedAt',
  'tenantId',

  // --- Populated Objects (FIXED) ---
  'status', // Add root key
  'status.*',
  'caseStudies', // Add root key
  'caseStudies.*',
  'resume', // Add root key
  'resume.*',
  'jobProfile', // Add root key
  'jobProfile.*',
];
const omitFields = (fieldsToOmit: string[]) =>
  ALL_APPLICATION_FIELDS.filter((field) => !fieldsToOmit.includes(field));

const CANDIDATE_CREATE_FIELDS = [
  // Core candidate inputs
  'jobId',
  'jobProfileId',
  'coverLetter',
  'resumeStorage.*',
  'caseStudyStorage.*',
  'answers.*',
  'portfolioUrl',
  'currentSalary',
  'expectedSalary',
];

const CANDIDATE_READ_FIELDS = omitFields(['isDeleted', 'deletedAt', 'rank']);

const EMPLOYER_UPDATE_FIELDS = ['statusId'];

export class ApplicationAuthZEntity {
  public readonly tenantId: string | null;
  public readonly jobProfileId: string | null;

  constructor({
    tenantId,
    jobProfileId,
  }: {
    tenantId?: string | null;
    jobProfileId?: string | null;
  }) {
    this.tenantId = tenantId ?? null;
    this.jobProfileId = jobProfileId ?? null;
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

      // Employers can update specific fields (status)
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
          jobProfileId: this.session.jobProfileId,
        },
      );

      // Candidates might be able to withdraw (soft delete)
      builder.can(AbilityAction.SoftDelete, ApplicationAuthZEntity, {
        jobProfileId: this.session.jobProfileId,
      });
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
      fieldMatcher: fieldPatternMatcher,
    });
  }
}
