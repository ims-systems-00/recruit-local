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

// ---  FIELD DEFINITIONS ---
export const ALL_JOB_PROFILE_FIELDS = [
  '_id',
  'userId',
  'name',
  'jobTitle',
  'industry',
  'workMode',
  'experienceLevel',
  'address',
  'email',
  'contactNumber',
  'summary',
  'portfolioUrl',
  'keywords',
  'languages',
  'skills',
  'interests',
  'values',
  'onboardingStep',
  'visibility',
  'status',
  'completion',
  // Profile & cover photos (FileMedia refs).
  'profileImageId',
  'coverPhotoId',
  'profileImage',
  'profileImage.*',
  'coverPhoto',
  'coverPhoto.*',
  'profileImageStorage',
  'profileImageStorage.*',
  'coverPhotoStorage',
  'coverPhotoStorage.*',
  'createdAt',
  'updatedAt',
];
// Public read set — the fields an employer may read on a PUBLIC + VERIFIED
// candidate profile. Explicit allow-list (a trust boundary, so it fails closed:
// new fields default to private). Gating fields (status, visibility), the
// internal onboardingStep, the server-computed completion metric, and write-only
// *Storage upload templates are intentionally excluded. The candidate still
// reads all of these on their OWN profile via the Read grant below.
const JOB_PROFILE_PUBLIC_READ_FIELDS = [
  '_id',
  'userId',
  'name',
  'jobTitle',
  'industry',
  'workMode',
  'experienceLevel',
  'address',
  'email',
  'contactNumber',
  'summary',
  'portfolioUrl',
  'keywords',
  'languages',
  'skills',
  'interests',
  'values',
  'profileImageId',
  'coverPhotoId',
  'profileImage',
  'profileImage.*',
  'coverPhoto',
  'coverPhoto.*',
  'createdAt',
  'updatedAt',
];

const CANDIDATE_MUTATION_FIELDS = [
  'name',
  'jobTitle',
  'industry',
  'workMode',
  'experienceLevel',
  'address',
  'email',
  'contactNumber',
  'summary',
  'portfolioUrl',
  'keywords',
  'languages',
  'skills',
  'interests',
  'values',
  'onboardingStep',
  'visibility',
  // Photo uploads: candidate submits the transient `*Storage` templates.
  'profileImageStorage',
  'profileImageStorage.*',
  'coverPhotoStorage',
  'coverPhotoStorage.*',
];

// --- 2. AUTHZ ENTITY ---
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

// --- 3. ABILITY BUILDER ---
export class JobProfileAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }

  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;
    const { user, jobProfileId } = this.session;

    // 1. PLATFORM ADMIN
    if (user.type === ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) {
      builder.can(AbilityAction.Manage, JobProfileAuthZEntity);
      return this.buildAbility();
    }

    // 2. CANDIDATE
    if (user.type === ACCOUNT_TYPE_ENUMS.CANDIDATE) {
      if (jobProfileId) {
        builder.can(AbilityAction.Read, JobProfileAuthZEntity, {
          _id: jobProfileId,
        });

        builder.can(
          AbilityAction.Update,
          JobProfileAuthZEntity,
          CANDIDATE_MUTATION_FIELDS,
          {
            _id: jobProfileId,
          },
        );

        builder.can(AbilityAction.SoftDelete, JobProfileAuthZEntity, {
          _id: jobProfileId,
        });
        builder.can(AbilityAction.Restore, JobProfileAuthZEntity, {
          _id: jobProfileId,
        });
      } else {
        builder.can(
          AbilityAction.Create,
          JobProfileAuthZEntity,
          CANDIDATE_MUTATION_FIELDS,
        );
      }
    }

    // 3. EMPLOYER
    if (user.type === ACCOUNT_TYPE_ENUMS.EMPLOYER) {
      builder.can(
        AbilityAction.Read,
        JobProfileAuthZEntity,
        JOB_PROFILE_PUBLIC_READ_FIELDS,
        {
          status: JOB_PROFILE_STATUS_ENUM.VERIFIED,
          visibility: VISIBILITY.PUBLIC,
        },
      );
    }

    return this.buildAbility();
  }

  private buildAbility(): AnyAbility {
    return this.abilityBuilder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
      fieldMatcher: fieldPatternMatcher,
    });
  }
}
