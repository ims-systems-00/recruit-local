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

export const ALL_PROMPT_FIELDS = [
  // --- Base & System Fields ---
  '_id',
  'id',
  'createdAt',
  'updatedAt',

  // --- Soft Delete Plugin ---
  'deleteMarker',
  'deleteMarker.status',
  'deleteMarker.deletedAt',
  'deleteMarker.dateScheduled',

  // --- Identity ---
  'name',
  'version',

  // --- Content ---
  'content',
  'variables',
  'labels',
  'commitMessage',

  // --- Optional per-prompt model overrides ---
  'config',
  'config.model',
  'config.temperature',

  // --- Authorship ---
  'createdBy',
];

/**
 * Carries no conditions: access to prompts is decided entirely by account type,
 * not by any property of the document. The class still exists because
 * `accessibleBy` and `permittedFieldsOf` are both keyed on the subject type.
 */
export class PromptAuthZEntity {
  public readonly _id: string | null;

  constructor({ _id }: { _id?: unknown } = {}) {
    this._id = _id ? String(_id) : null;
  }
}

type ClaimAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof PromptAuthZEntity>
>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;

/**
 * Gates the prompt registry.
 *
 * Platform admins only, with no rule at all for employers or candidates — the
 * same shape as the other platform-owned catalogues (job titles, industries).
 * Prompts are the agent's operating instructions, so read access is as
 * sensitive as write access: knowing the exact system prompt is the first step
 * in working around it.
 *
 * Note what this does *not* gate: the runtime's own prompt lookup. The agent
 * runs under a candidate or employer session, which has no rule here, so
 * `prompt.resolver.ts` deliberately reads the model directly rather than going
 * through a controller.
 */
export class PromptAbilityBuilder implements IAbilityBuilder {
  private abilityBuilder: AbilityBuilder<ClaimAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(ClaimAbility);
    this.session = session;
  }

  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;

    if (this.session.user.type === ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) {
      builder.can(AbilityAction.Manage, PromptAuthZEntity);
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
      fieldMatcher: fieldPatternMatcher,
    });
  }
}
