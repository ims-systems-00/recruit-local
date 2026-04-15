import { PROFICIENCY } from './enums';

export interface language {
  name: string;
  proficiencyLevel: PROFICIENCY;
}

export enum JOB_PROFILE_STATUS_ENUM {
  VERIFIED = 'verified',
  UNVERIFIED = 'unverified',
}
