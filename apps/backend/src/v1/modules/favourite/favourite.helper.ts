/* eslint-disable @typescript-eslint/no-explicit-any */
import { JobAbilityBuilder, JobAuthZEntity, ALL_JOB_FIELDS } from "@rl/authz";
import { modelNames } from "../../../models/constants";
import { AbilityAction } from "../../../types/ability";
import { sanitizeDocument } from "../../../common/helper/authz";

// Helper to handle the switch logic for sanitizing different entities
export const sanitizeFavouriteItem = (item: any, itemType: string, session: any) => {
  if (!item) return null; // Handle cases where the underlying item was deleted

  switch (itemType) {
    case modelNames.JOB: {
      const ability = new JobAbilityBuilder(session).getAbility();
      // Only sanitize if they actually have read permission for this specific row
      if (!ability.can(AbilityAction.Read, new JobAuthZEntity(item))) return null;

      return sanitizeDocument<JobAuthZEntity>(item, ability, AbilityAction.Read, JobAuthZEntity, {
        fieldsFrom: () => ALL_JOB_FIELDS,
      });
    }

    default:
      return null;
  }
};
