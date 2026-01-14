'use client';
import { createContext, useContext } from 'react';
import { createContextualCan } from '@casl/react';
import {
  AnyAbility,
  PureAbility,
  AbilityClass,
  AbilityBuilder,
} from '@casl/ability';
import { AbilityAction } from '@inrm/types';
type ClaimAbility = PureAbility<[AbilityAction.Manage, 'all']>;
const ClaimAbility = PureAbility as AbilityClass<ClaimAbility>;
export const ability = new AbilityBuilder(ClaimAbility);
ability.cannot(AbilityAction.Manage, 'all');
export const AbilityContext = createContext<AnyAbility>(ability.build());
export const Can = createContextualCan(AbilityContext.Consumer);
export const useAbility = () => {
  return useContext(AbilityContext);
};
