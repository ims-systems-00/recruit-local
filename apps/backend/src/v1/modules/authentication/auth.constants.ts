import { ACCOUNT_TYPE_ENUMS } from "@rl/types";

/**
 * Account types a visitor may create for themselves through `/auth/registration`.
 *
 * `platform-admin` is deliberately absent: those accounts are created by the
 * seeder (`src/seeders/user.seeder.ts`) from `ADMIN_USER_EMAIL` /
 * `ADMIN_USER_PASSWORD`, never through a public endpoint. Anything not on this
 * list is rejected by the Joi schema and again in the service, so a payload
 * that gets past one layer still cannot mint an admin.
 */
export const SELF_REGISTERABLE_ACCOUNT_TYPES = [ACCOUNT_TYPE_ENUMS.EMPLOYER, ACCOUNT_TYPE_ENUMS.CANDIDATE] as const;

export const isSelfRegisterableAccountType = (type?: ACCOUNT_TYPE_ENUMS): boolean =>
  SELF_REGISTERABLE_ACCOUNT_TYPES.includes(type as (typeof SELF_REGISTERABLE_ACCOUNT_TYPES)[number]);
