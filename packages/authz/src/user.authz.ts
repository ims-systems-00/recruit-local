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
  USER_ROLE_ENUMS,
  ISession,
  IAbilityBuilder,
  AbilityAction,
} from '@rl/types';

// --- 1. FIELD DEFINITIONS ---
export const ALL_USER_FIELDS = [
  '_id',
  'id',
  'firstName',
  'lastName',
  'fullName',
  'email',
  'type',
  'emailVerificationStatus',
  'role',
  'createdAt',
  'updatedAt',
  'tenantId',
  'jobProfileId',
  'password',
  'isDeleted',
  'deletedAt',
  'kycStatus',
];

// Helper: build a field list by removing the given fields from ALL_USER_FIELDS.
const omitFields = (fieldsToOmit: string[]) =>
  ALL_USER_FIELDS.filter((field) => !fieldsToOmit.includes(field));

// Base groups shared across rules.
const SENSITIVE_FIELDS = ['password']; // never read or mass-assigned
const NON_READABLE_FIELDS = [...SENSITIVE_FIELDS, 'isDeleted', 'deletedAt']; // hidden from every read

// Everything except the sensitive fields — admin-level read / manage scope.
const NON_SENSITIVE_FIELDS = omitFields(SENSITIVE_FIELDS);

// Read scopes per role. A candidate exposes the same fields whether viewed by
// itself or by an employer, so one list covers both cases.
const CANDIDATE_READ_FIELDS = omitFields([...NON_READABLE_FIELDS, 'role', 'tenantId']);
const EMPLOYER_SELF_READ_FIELDS = omitFields([...NON_READABLE_FIELDS, 'tenantId']);
const EMPLOYER_PUBLIC_READ_FIELDS = omitFields([...NON_READABLE_FIELDS, 'role', 'jobProfileId']);

// Update scopes. Self-service is limited to personal details (and the user's own
// password); everything else is system- or admin-managed.
const SELF_UPDATE_FIELDS = omitFields([
  '_id',
  'id',
  'email',
  'emailVerificationStatus',
  'createdAt',
  'updatedAt',
  'tenantId',
  'jobProfileId',
  'type',
  'role',
  'kycStatus',
  'isDeleted',
  'deletedAt',
]);
const TENANT_ADMIN_UPDATE_FIELDS = omitFields([
  ...SENSITIVE_FIELDS,
  'tenantId',
  'type',
  'isDeleted',
  'deletedAt',
  'kycStatus',
]);

// --- 2. AUTHZ ENTITY ---
export class UserAuthZEntity {
  public readonly tenantId: string | null;
  public readonly _id: string | null;
  public readonly type?: ACCOUNT_TYPE_ENUMS;

  constructor({
    tenantId,
    _id,
    type,
  }: {
    tenantId?: string | null;
    _id?: string | null;
    type?: ACCOUNT_TYPE_ENUMS;
  }) {
    this.tenantId = tenantId ?? null;
    this._id = _id ?? null;
    this.type = type ?? undefined;
  }
}

type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof UserAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

// --- 3. ABILITY BUILDER ---
export class UserAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }

  getAbility(): AnyAbility {
    // Destructuring for cleaner, shorter rule definitions
    const { can } = this.abilityBuilder;
    const { user, tenantId } = this.session;

    // BASELINE: All users can read and update their own safe fields
    can(AbilityAction.Update, UserAuthZEntity, SELF_UPDATE_FIELDS, {
      _id: user._id,
    });

    can(AbilityAction.SoftDelete, UserAuthZEntity, {
      _id: user._id,
    });

    can(AbilityAction.Restore, UserAuthZEntity, {
      _id: user._id,
    });

    // PLATFORM ADMIN
    if (user.type === ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) {
      can(AbilityAction.Manage, UserAuthZEntity, NON_SENSITIVE_FIELDS);

      // Early return: Platform Admins don't need the other granular rules evaluated
      return this.buildAbility();
    }

    // EMPLOYER
    if (user.type === ACCOUNT_TYPE_ENUMS.EMPLOYER) {
      // own
      can(AbilityAction.Read, UserAuthZEntity, EMPLOYER_SELF_READ_FIELDS, {
        _id: user._id,
      });
      // View coworkers in the same tenant
      can(AbilityAction.Read, UserAuthZEntity, EMPLOYER_PUBLIC_READ_FIELDS, {
        type: ACCOUNT_TYPE_ENUMS.EMPLOYER,
        tenantId: tenantId,
      });

      // View candidates across the platform
      can(AbilityAction.Read, UserAuthZEntity, CANDIDATE_READ_FIELDS, {
        type: ACCOUNT_TYPE_ENUMS.CANDIDATE,
      });
    }

    // TENANT ADMIN
    if (
      user.type === ACCOUNT_TYPE_ENUMS.EMPLOYER &&
      user.role === USER_ROLE_ENUMS.ADMIN
    ) {
      // Broad read access to their entire tenant
      can(AbilityAction.Read, UserAuthZEntity, NON_SENSITIVE_FIELDS, {
        tenantId: tenantId,
      });

      // Update other employers in their tenant
      can(AbilityAction.Update, UserAuthZEntity, TENANT_ADMIN_UPDATE_FIELDS, {
        type: ACCOUNT_TYPE_ENUMS.EMPLOYER,
        tenantId: tenantId,
      });

      can(AbilityAction.SoftDelete, UserAuthZEntity, {
        tenantId: tenantId,
      });

      can(AbilityAction.Restore, UserAuthZEntity, {
        tenantId: tenantId,
      });
    }

    // CANDIDATE
    if (user.type === ACCOUNT_TYPE_ENUMS.CANDIDATE) {
      can(AbilityAction.Read, UserAuthZEntity, CANDIDATE_READ_FIELDS, {
        _id: user._id,
      });
      // View employers across the platform
      can(AbilityAction.Read, UserAuthZEntity, EMPLOYER_PUBLIC_READ_FIELDS, {
        type: ACCOUNT_TYPE_ENUMS.EMPLOYER,
      });
    }

    return this.buildAbility();
  }

  // Extracted to keep the main logic block clean
  private buildAbility(): AnyAbility {
    return this.abilityBuilder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
      fieldMatcher: fieldPatternMatcher,
    });
  }
}
