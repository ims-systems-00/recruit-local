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
  JOBS_STATUS_ENUMS,
} from '@rl/types';

export const ALL_JOB_FIELDS = [
  // --- Base & System Fields ---
  '_id',
  'id',
  'createdAt',
  'updatedAt',

  // --- Tenant & Soft Delete Plugins ---
  'tenantId',
  'isDeleted',
  'deletedAt',

  // --- Core Job Fields ---
  'title',
  'description',
  'email',
  'number',
  'aboutUs',
  'startDate',
  'endDate',
  'yearOfExperience',
  'responsibility',
  'attachmentIds',
  'category',
  'vacancy',
  'location',
  'locationAdditionalInfo',
  'workplace',
  'workingDays',
  'weekends',
  'workingHours',
  'workingHours.startTime',
  'workingHours.endTime',
  'employmentType',
  'salary',
  'period',
  'requiredDocuments',
  'status',
  'formId',
  'keywords',
  'reference',
  'totalApplications',

  // --- Board Settings ---
  'boardBackground',
  'boardSortBy',
  'boardSortOrder',
];

const omitFields = (fieldsToOmit: string[]) =>
  ALL_JOB_FIELDS.filter((field) => !fieldsToOmit.includes(field));

const EMPLOYER_CREATE_FIELDS = [
  'title',
  'description',
  'email',
  'number',
  'aboutUs',
  'autoFill',
  'category',
  'vacancy',
  'location',
  'responsibility',
  'yearOfExperience',
  'startDate',
  'endDate',
  'attachmentsStorage',
  'workplace',
  'workingDays',
  'weekends',
  'employmentType',
  'period',
  'requiredDocuments',
  'workingHours',
  'workingHours.startTime',
  'workingHours.endTime',
  'salary',
  'keywords',
  'boardBackground',
  'boardSortBy',
  'boardSortOrder',
];

const CANDIDATE_READ_FIELDS = omitFields([
  'isDeleted',
  'deletedAt',
  'totalApplications',
  'status',
]);

const EMPLOYER_UPDATE_FIELDS = [...EMPLOYER_CREATE_FIELDS, 'status'];

export class JobAuthZEntity {
  public readonly tenantId: string | null;
  public readonly status: JOBS_STATUS_ENUMS;
  constructor({
    tenantId,
    status,
  }: {
    tenantId?: string | null;
    status?: JOBS_STATUS_ENUMS;
  }) {
    this.tenantId = tenantId ?? null;
    this.status = status ?? JOBS_STATUS_ENUMS.DRAFT;
  }
}

type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof JobAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class JobAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }

  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;

    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) {
      builder.can(AbilityAction.Manage, JobAuthZEntity);
    }

    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.EMPLOYER) {
      builder.can(AbilityAction.Create, JobAuthZEntity, EMPLOYER_CREATE_FIELDS);
      builder.can(AbilityAction.Read, JobAuthZEntity, ALL_JOB_FIELDS);
      builder.can(
        AbilityAction.Update,
        JobAuthZEntity,
        EMPLOYER_UPDATE_FIELDS,
        {
          tenantId: this.session.tenantId,
        },
      );
      builder.can(AbilityAction.SoftDelete, JobAuthZEntity, {
        tenantId: this.session.tenantId,
      });
    }

    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.CANDIDATE) {
      builder.can(AbilityAction.Read, JobAuthZEntity, CANDIDATE_READ_FIELDS, {
        status: JOBS_STATUS_ENUMS.OPEN,
      });
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
      fieldMatcher: fieldPatternMatcher,
    });
  }
}
