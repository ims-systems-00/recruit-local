export enum ONBOARDING_STEP_ENUMS {
  NOT_STARTED = 'not_started',
  VALUES_STEP_1 = 'values_step_1',
  VALUES_STEP_2 = 'values_step_2',
  VALUES_STEP_3 = 'values_step_3',
  VALUES_STEP_4 = 'values_step_4',
  VALUES_STEP_5 = 'values_step_5',
  CV_UPLOAD = 'cv_upload',
  JOB_TITLE = 'job_title',
  INDUSTRY = 'industry',
  EXPERIENCE_LEVEL = 'experience_level',
  WORK_MODE = 'work_mode',
  LOCATION = 'location',
  NOTICE_BY_EMPLOYEE = 'notice_by_employee',
  COMPLETED = 'completed',
}

/**
 * The order the steps are actually walked in, per audience.
 *
 * The enum above is a set of names and says nothing about sequence — a value's
 * position in a TypeScript enum is not a product decision. These arrays are the
 * sequence, and they exist so that "what comes next" is answered from one place
 * rather than re-derived by whoever needs it.
 *
 * They mirror the onboarding routes under `apps/frontend/app/(auth)/`, which is
 * a coupling worth naming: the frontend decides the order by where each step
 * navigates next, and these arrays restate it. If a step is inserted, moved or
 * removed there, update these — nothing will fail loudly, the assistant will
 * simply start telling users to do the wrong thing next.
 */
export const CANDIDATE_ONBOARDING_SEQUENCE: ONBOARDING_STEP_ENUMS[] = [
  ONBOARDING_STEP_ENUMS.CV_UPLOAD,
  ONBOARDING_STEP_ENUMS.JOB_TITLE,
  ONBOARDING_STEP_ENUMS.INDUSTRY,
  ONBOARDING_STEP_ENUMS.EXPERIENCE_LEVEL,
  ONBOARDING_STEP_ENUMS.WORK_MODE,
  ONBOARDING_STEP_ENUMS.LOCATION,
  ONBOARDING_STEP_ENUMS.VALUES_STEP_1,
  ONBOARDING_STEP_ENUMS.VALUES_STEP_2,
  ONBOARDING_STEP_ENUMS.VALUES_STEP_3,
  ONBOARDING_STEP_ENUMS.VALUES_STEP_4,
  ONBOARDING_STEP_ENUMS.VALUES_STEP_5,
  ONBOARDING_STEP_ENUMS.NOTICE_BY_EMPLOYEE,
];

/**
 * Employers walk the values rounds only.
 *
 * Choosing a role and creating the organisation come first in the UI but are not
 * recorded here, because they are not states a tenant can be *in*: the tenant
 * document does not exist until they are done, so "has a tenant" already answers
 * whether they happened.
 */
export const EMPLOYER_ONBOARDING_SEQUENCE: ONBOARDING_STEP_ENUMS[] = [
  ONBOARDING_STEP_ENUMS.VALUES_STEP_1,
  ONBOARDING_STEP_ENUMS.VALUES_STEP_2,
  ONBOARDING_STEP_ENUMS.VALUES_STEP_3,
  ONBOARDING_STEP_ENUMS.VALUES_STEP_4,
  ONBOARDING_STEP_ENUMS.VALUES_STEP_5,
];

/**
 * Human wording for each step, for anything that says a step name out loud.
 *
 * The enum values are snake_case identifiers; `values_step_3` read back to a
 * user is a leak of the schema, not an answer.
 */
export const ONBOARDING_STEP_LABELS: Record<ONBOARDING_STEP_ENUMS, string> = {
  [ONBOARDING_STEP_ENUMS.NOT_STARTED]: 'Not started',
  [ONBOARDING_STEP_ENUMS.CV_UPLOAD]: 'Upload your CV',
  [ONBOARDING_STEP_ENUMS.JOB_TITLE]: 'Choose the job titles you want',
  [ONBOARDING_STEP_ENUMS.INDUSTRY]: 'Choose your industries',
  [ONBOARDING_STEP_ENUMS.EXPERIENCE_LEVEL]: 'Set your experience level',
  [ONBOARDING_STEP_ENUMS.WORK_MODE]: 'Choose your work mode',
  [ONBOARDING_STEP_ENUMS.LOCATION]: 'Set your location',
  [ONBOARDING_STEP_ENUMS.VALUES_STEP_1]: 'Workplace values, round 1 of 5',
  [ONBOARDING_STEP_ENUMS.VALUES_STEP_2]: 'Workplace values, round 2 of 5',
  [ONBOARDING_STEP_ENUMS.VALUES_STEP_3]: 'Workplace values, round 3 of 5',
  [ONBOARDING_STEP_ENUMS.VALUES_STEP_4]: 'Workplace values, round 4 of 5',
  [ONBOARDING_STEP_ENUMS.VALUES_STEP_5]: 'Workplace values, round 5 of 5',
  [ONBOARDING_STEP_ENUMS.NOTICE_BY_EMPLOYEE]: 'Tell us your notice period',
  [ONBOARDING_STEP_ENUMS.COMPLETED]: 'Setup complete',
};
