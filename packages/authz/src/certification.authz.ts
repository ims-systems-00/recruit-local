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

export const ALL_CERTIFICATION_FIELDS = [
  // --- Base & System Fields ---
  '_id',
  'id',
  'createdAt',
  'updatedAt',

  // --- Soft Delete Plugin (ISoftDeleteDoc) ---
  'deleteMarker',
  'deleteMarker.*',

  // --- Ownership (userOwnedPlugin & jobProfilePlugin) ---
  'userId',
  'jobProfileId',

  // --- Core Certification Fields ---
  'title',
  'issuingOrganization',
  'issueDate',

  // Certificate image (FileMedia ref). The candidate submits the transient
  // `imageStorage` template; the server persists `imageId`.
  'imageId',
  'imageStorage',
  'imageStorage.*',
];

const omitFields = (fieldsToOmit: string[]) =>
  ALL_CERTIFICATION_FIELDS.filter((field) => !fieldsToOmit.includes(field));

const CANDIDATE_CREATE_FIELDS = [
  'jobProfileId',
  'title',
  'issuingOrganization',
  'issueDate',
  'imageStorage',
  'imageStorage.*',
];

const CANDIDATE_UPDATE_FIELDS = [
  'title',
  'issuingOrganization',
  'issueDate',
  'imageStorage',
  'imageStorage.*',
];

// `imageStorage` is an upload template on the way in, never part of a response.
const READ_FIELDS = omitFields([
  'deleteMarker',
  'deleteMarker.*',
  'imageStorage',
  'imageStorage.*',
]);

export class CertificationAuthZEntity {
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
  MongoQuery<typeof CertificationAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class CertificationAbilityBuilder implements IAbilityBuilder {
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
      builder.can(AbilityAction.Manage, CertificationAuthZEntity);
    }

    // --- Candidate (owns their certifications via jobProfileId) ---
    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.CANDIDATE) {
      builder.can(
        AbilityAction.Create,
        CertificationAuthZEntity,
        CANDIDATE_CREATE_FIELDS,
      );

      builder.can(AbilityAction.Read, CertificationAuthZEntity, READ_FIELDS, {
        jobProfileId: this.session.jobProfileId,
      });

      builder.can(
        AbilityAction.Update,
        CertificationAuthZEntity,
        CANDIDATE_UPDATE_FIELDS,
        {
          jobProfileId: this.session.jobProfileId,
        },
      );

      builder.can(AbilityAction.SoftDelete, CertificationAuthZEntity, {
        jobProfileId: this.session.jobProfileId,
      });

      builder.can(AbilityAction.Restore, CertificationAuthZEntity, {
        jobProfileId: this.session.jobProfileId,
      });

      builder.can(AbilityAction.HardDelete, CertificationAuthZEntity, {
        jobProfileId: this.session.jobProfileId,
      });
    }

    // --- Employer (reads candidate certifications; the parent profile's
    // visibility is enforced by assertCanReadJobProfile in the controller,
    // since `visibility` is not a field on this document) ---
    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.EMPLOYER) {
      builder.can(AbilityAction.Read, CertificationAuthZEntity, READ_FIELDS);
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
      fieldMatcher: fieldPatternMatcher,
    });
  }
}
