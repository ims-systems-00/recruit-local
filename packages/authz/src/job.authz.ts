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
  'endDate',
  'yearOfExperience',
  'responsibility',
  'attachmentIds',
  'attachments',
  'alreadyApplied',
  'alreadySaved',
  // Id of the viewer's favourite, so a client can undo the save without a lookup
  // (`DELETE /favourites/:id/soft`). Null when the job is not saved. Server-derived
  // and read-only — absent from EMPLOYER_CREATE_FIELDS/EMPLOYER_UPDATE_FIELDS.
  'alreadySavedId',
  // The viewer's match against the job, 0-100 or null, and (single-job reads
  // only) the parts behind it; only for a viewer with a job profile.
  // Server-derived and read-only — absent from EMPLOYER_CREATE_FIELDS/EMPLOYER_UPDATE_FIELDS.
  'matchPercentage',
  'matchBreakdown',
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

  // --- Forms & Queries ---
  'formId',
  // 'additionalQueries',
  'additionalQueries.question',
  'additionalQueries.type',
  'additionalQueries.options',
  'additionalQueries.isRequired',
  'additionalQueries.expectedAnswer',
  'additionalQueries._id',

  // --- Skills (each row's `skill` is populated from the skill catalogue on read) ---
  'skills',

  // --- Values (each row's `value` is populated, and `weight` derived from
  // `priority`, on read). Listed per sub-field, like additionalQueries, so a
  // role can be shown which values a job wants without the employer's ranking. ---
  'values.value',
  'values.priority',

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
  'locationAdditionalInfo',
  'responsibility',
  'yearOfExperience',
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

  // additional queries
  'formId',
  'additionalQueries',

  // skills & requirements
  'skills',

  // values & priorities
  'values',
];

const CANDIDATE_READ_FIELDS = omitFields([
  'isDeleted',
  'deletedAt',
  'status',
  'formId',
  'boardBackground',
  'boardSortBy',
  'boardSortOrder',
  'additionalQueries.expectedAnswer',
  // The employer's ranking of its values. Candidates scoring their own values
  // could otherwise tune their answers to whatever a job marks Essential.
  'values.priority',
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
      // builder.can(AbilityAction.Read, JobAuthZEntity, CANDIDATE_READ_FIELDS);
      builder.can(AbilityAction.Read, JobAuthZEntity, ALL_JOB_FIELDS, {
        tenantId: this.session.tenantId,
      });
      builder.can(
        AbilityAction.Update,
        JobAuthZEntity,
        EMPLOYER_UPDATE_FIELDS,
        {
          tenantId: this.session.tenantId,
          status: { $ne: JOBS_STATUS_ENUMS.OPEN },
        },
      );
      builder.can(AbilityAction.Update, JobAuthZEntity, ['status'], {
        tenantId: this.session.tenantId,
        status: JOBS_STATUS_ENUMS.OPEN,
      });
      builder.can(AbilityAction.SoftDelete, JobAuthZEntity, {
        tenantId: this.session.tenantId,
      });
      builder.can(AbilityAction.HardDelete, JobAuthZEntity, {
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
