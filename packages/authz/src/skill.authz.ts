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

export const ALL_SKILL_FIELDS = [
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

  // --- Core Skill Fields (ISkill) ---
  'name',
  'proficiencyLevel',
  'description',
];

const omitFields = (fieldsToOmit: string[]) =>
  ALL_SKILL_FIELDS.filter((field) => !fieldsToOmit.includes(field));

const CANDIDATE_CREATE_FIELDS = [
  'jobProfileId',
  'name',
  'proficiencyLevel',
  'description',
];

const CANDIDATE_UPDATE_FIELDS = ['name', 'proficiencyLevel', 'description'];

const READ_FIELDS = omitFields(['deleteMarker', 'deleteMarker.*']);

export class SkillAuthZEntity {
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
  MongoQuery<typeof SkillAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class SkillAbilityBuilder implements IAbilityBuilder {
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
      builder.can(AbilityAction.Manage, SkillAuthZEntity);
    }

    // --- Candidate (owns their skills via jobProfileId) ---
    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.CANDIDATE) {
      builder.can(
        AbilityAction.Create,
        SkillAuthZEntity,
        CANDIDATE_CREATE_FIELDS,
      );

      builder.can(AbilityAction.Read, SkillAuthZEntity, READ_FIELDS, {
        jobProfileId: this.session.jobProfileId,
      });

      builder.can(
        AbilityAction.Update,
        SkillAuthZEntity,
        CANDIDATE_UPDATE_FIELDS,
        {
          jobProfileId: this.session.jobProfileId,
        },
      );

      builder.can(AbilityAction.SoftDelete, SkillAuthZEntity, {
        jobProfileId: this.session.jobProfileId,
      });

      builder.can(AbilityAction.Restore, SkillAuthZEntity, {
        jobProfileId: this.session.jobProfileId,
      });

      builder.can(AbilityAction.HardDelete, SkillAuthZEntity, {
        jobProfileId: this.session.jobProfileId,
      });
    }

    // --- Employer (reads candidate skills; the parent profile's visibility is
    // enforced by assertCanReadJobProfile in the controller, since `visibility`
    // is not a field on this document) ---
    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.EMPLOYER) {
      builder.can(AbilityAction.Read, SkillAuthZEntity, READ_FIELDS);
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
      fieldMatcher: fieldPatternMatcher,
    });
  }
}
