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

// `normalizedName` is left out on purpose: it is derived by the model, so it is
// never returned and never accepted from a client.
export const ALL_SKILL_CATALOG_FIELDS = [
  // --- Base & System Fields ---
  '_id',
  'id',
  'createdAt',
  'updatedAt',

  // --- Soft Delete Plugin (ISoftDeleteDoc) ---
  'deleteMarker',
  'deleteMarker.*',

  // --- Core Fields (ISkillCatalog) ---
  'name',
  'description',
  'isActive',
];

const omitFields = (fieldsToOmit: string[]) =>
  ALL_SKILL_CATALOG_FIELDS.filter((field) => !fieldsToOmit.includes(field));

const READ_FIELDS = omitFields(['deleteMarker', 'deleteMarker.*']);

export class SkillCatalogAuthZEntity {
  public readonly _id: string | null;
  public readonly isActive: boolean | null;

  constructor({
    _id,
    isActive,
  }: {
    _id?: string | null;
    isActive?: boolean | null;
  }) {
    this._id = _id ?? null;
    this.isActive = isActive ?? null;
  }
}

type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof SkillCatalogAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

export class SkillCatalogAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }

  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;

    // --- Platform Admin (curates the catalogue, inactive entries included) ---
    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) {
      builder.can(AbilityAction.Manage, SkillCatalogAuthZEntity);
    }

    // --- Employer (picks a job's skills) & Candidate (later: their own) ---
    // Active entries only. The condition doubles as the list's security query,
    // so a deactivated skill drops out of search without the controller asking.
    if (
      this.session.user.type === ACCOUNT_TYPE_ENUMS.EMPLOYER ||
      this.session.user.type === ACCOUNT_TYPE_ENUMS.CANDIDATE
    ) {
      builder.can(AbilityAction.Read, SkillCatalogAuthZEntity, READ_FIELDS, {
        isActive: true,
      });
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
      fieldMatcher: fieldPatternMatcher,
    });
  }
}
