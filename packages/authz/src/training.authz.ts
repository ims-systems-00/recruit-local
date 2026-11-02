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
import { dropUnscopedRules } from './scoped-rules';

import {
  ACCOUNT_TYPE_ENUMS,
  ISession,
  IAbilityBuilder,
  AbilityAction,
} from '@rl/types';

export const ALL_TRAINING_FIELDS = [
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

  // --- Core Training Fields (ITraining) ---
  'organizationName',
  'courseName',
  'skills',
  'isCurrentlyEnrolled',
  'startDate',
  'endDate',

  // Certificate file (FileMedia ref). The candidate submits the transient
  // `certificateStorage` template; the server persists `certificateId` and
  // reads return the looked-up `certificate`.
  'certificateId',
  'certificate',
  'certificate.*',
  'certificateStorage',
  'certificateStorage.*',
];

const omitFields = (fieldsToOmit: string[]) =>
  ALL_TRAINING_FIELDS.filter((field) => !fieldsToOmit.includes(field));

const CANDIDATE_CREATE_FIELDS = [
  'jobProfileId',
  'organizationName',
  'courseName',
  'skills',
  'isCurrentlyEnrolled',
  'startDate',
  'endDate',
  'certificateStorage',
  'certificateStorage.*',
];

const CANDIDATE_UPDATE_FIELDS = [
  'organizationName',
  'courseName',
  'skills',
  'isCurrentlyEnrolled',
  'startDate',
  'endDate',
  'certificateStorage',
  'certificateStorage.*',
];

// `certificateStorage` is an upload template on the way in, never part of a response.
const READ_FIELDS = omitFields([
  'deleteMarker',
  'deleteMarker.*',
  'certificateStorage',
  'certificateStorage.*',
]);

export class TrainingAuthZEntity {
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
  MongoQuery<typeof TrainingAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class TrainingAbilityBuilder implements IAbilityBuilder {
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
      builder.can(AbilityAction.Manage, TrainingAuthZEntity);
    }

    // --- Candidate (owns their trainings via jobProfileId) ---
    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.CANDIDATE) {
      // Scoped like the rules below: a candidate adds trainings to their own
      // profile only, never to one named in someone else's request body.
      builder.can(
        AbilityAction.Create,
        TrainingAuthZEntity,
        CANDIDATE_CREATE_FIELDS,
        {
          jobProfileId: this.session.jobProfileId,
        },
      );

      builder.can(AbilityAction.Read, TrainingAuthZEntity, READ_FIELDS, {
        jobProfileId: this.session.jobProfileId,
      });

      builder.can(
        AbilityAction.Update,
        TrainingAuthZEntity,
        CANDIDATE_UPDATE_FIELDS,
        {
          jobProfileId: this.session.jobProfileId,
        },
      );

      builder.can(AbilityAction.SoftDelete, TrainingAuthZEntity, {
        jobProfileId: this.session.jobProfileId,
      });

      builder.can(AbilityAction.Restore, TrainingAuthZEntity, {
        jobProfileId: this.session.jobProfileId,
      });

      builder.can(AbilityAction.HardDelete, TrainingAuthZEntity, {
        jobProfileId: this.session.jobProfileId,
      });
    }

    // --- Employer (reads candidate trainings; the parent profile's
    // visibility is enforced by assertCanReadJobProfile in the controller,
    // since `visibility` is not a field on this document) ---
    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.EMPLOYER) {
      builder.can(AbilityAction.Read, TrainingAuthZEntity, READ_FIELDS);
    }

    return dropUnscopedRules(builder).build({
      conditionsMatcher: buildMongoQueryMatcher(),
      fieldMatcher: fieldPatternMatcher,
    });
  }
}
