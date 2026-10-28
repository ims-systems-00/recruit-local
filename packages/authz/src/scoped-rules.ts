import { AbilityBuilder, AnyAbility } from '@casl/ability';

const hasUndefinedValue = (value: unknown): boolean => {
  if (value === undefined) return true;
  if (Array.isArray(value)) return value.some(hasUndefinedValue);
  if (value && typeof value === 'object') {
    return Object.values(value).some(hasUndefinedValue);
  }
  return false;
};

/**
 * Removes every rule scoped to a session value the session does not have — an
 * employer's `{ tenantId }` before they have created an organisation, a
 * candidate's `{ jobProfileId }` before their profile exists.
 *
 * Left in, such a rule is worse than useless. CASL drops a condition whose value
 * is `undefined` when it turns rules into a database query, so `accessibleBy`
 * gives `{ $or: [{}] }` and a list matches every row on the platform, while the
 * per-document check on the same rule fails closed. Removed, both fail closed:
 * the account can do nothing the rule would have scoped.
 *
 * Only `can` rules are removed. Removing a `cannot` would widen access, and none
 * are written in this package; one scoped to a missing value is kept, which
 * errs on the side of refusing.
 *
 * Every builder calls this on its builder immediately before `build`.
 */
export const dropUnscopedRules = <A extends AnyAbility>(
  builder: AbilityBuilder<A>,
): AbilityBuilder<A> => {
  // In place: `build` reads `builder.rules`.
  for (let index = builder.rules.length - 1; index >= 0; index -= 1) {
    const rule = builder.rules[index] as {
      inverted?: boolean;
      conditions?: unknown;
    };
    if (
      !rule.inverted &&
      rule.conditions &&
      hasUndefinedValue(rule.conditions)
    ) {
      builder.rules.splice(index, 1);
    }
  }

  return builder;
};
