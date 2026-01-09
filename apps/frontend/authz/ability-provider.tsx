'use client';
import { AnyAbility, buildMongoQueryMatcher, PureAbility } from '@casl/ability';
import { useCallback } from 'react';
import { AbilityContext, ability } from './ability-context';
import {
  JobAbilityBuilder,
  TenantAbilityBuilder,
  UserAbilityBuilder,
} from '@inrm/authz';
import { useSession } from 'next-auth/react';

export const AbilityProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { data: session } = useSession();

  const buildAbility = useCallback((): AnyAbility => {
    if (!session) return ability.build();

    const tenantAbility = new TenantAbilityBuilder({ user: session?.user });
    const userAbility = new UserAbilityBuilder({ user: session?.user });
    const jobAbility = new JobAbilityBuilder({ user: session?.user });

    const appRules = [
      ...tenantAbility.getAbility().rules,
      ...userAbility.getAbility().rules,
      ...jobAbility.getAbility().rules,
    ];
    const appAbilities = new PureAbility(appRules, {
      conditionsMatcher: buildMongoQueryMatcher(),
    });
    return appAbilities;
  }, [session]);
  return (
    <AbilityContext.Provider value={buildAbility()}>
      {children}
    </AbilityContext.Provider>
  );
};
