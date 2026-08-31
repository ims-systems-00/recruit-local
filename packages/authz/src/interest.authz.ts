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

export const ALL_INTEREST_FIELDS = [
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

  // --- Core Interest Fields (IInterest) ---
  'name',
  'description',
];

const omitFields = (fieldsToOmit: string[]) =>
  ALL_INTEREST_FIELDS.filter((field) => !fieldsToOmit.includes(field));

const CANDIDATE_CREATE_FIELDS = ['jobProfileId', 'name', 'description'];

const CANDIDATE_UPDATE_FIELDS = ['name', 'description'];

const READ_FIELDS = omitFields(['deleteMarker', 'deleteMarker.*']);

export class InterestAuthZEntity {
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
  MongoQuery<typeof InterestAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class InterestAbilityBuilder implements IAbilityBuilder {
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
      builder.can(AbilityAction.Manage, InterestAuthZEntity);
    }

    // --- Candidate (owns their interests via jobProfileId) ---
    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.CANDIDATE) {
      builder.can(
        AbilityAction.Create,
        InterestAuthZEntity,
        CANDIDATE_CREATE_FIELDS,
      );

      builder.can(AbilityAction.Read, InterestAuthZEntity, READ_FIELDS, {
        jobProfileId: this.session.jobProfileId,
      });

      builder.can(
        AbilityAction.Update,
        InterestAuthZEntity,
        CANDIDATE_UPDATE_FIELDS,
        {
          jobProfileId: this.session.jobProfileId,
        },
      );

      builder.can(AbilityAction.SoftDelete, InterestAuthZEntity, {
        jobProfileId: this.session.jobProfileId,
      });

      builder.can(AbilityAction.Restore, InterestAuthZEntity, {
        jobProfileId: this.session.jobProfileId,
      });

      builder.can(AbilityAction.HardDelete, InterestAuthZEntity, {
        jobProfileId: this.session.jobProfileId,
      });
    }

    // --- Employer (reads candidate interests; the parent profile's visibility
    // is enforced by assertCanReadJobProfile in the controller, since
    // `visibility` is not a field on this document) ---
    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.EMPLOYER) {
      builder.can(AbilityAction.Read, InterestAuthZEntity, READ_FIELDS);
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
      fieldMatcher: fieldPatternMatcher,
    });
  }
}
