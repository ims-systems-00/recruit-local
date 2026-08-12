export interface IExperienceLevel {
  name: string;
  description?: string;
  isActive?: boolean;
  /**
   * The span of professional experience this level represents, in years. It is
   * what lets a candidate's level be compared against a job's numeric
   * `yearOfExperience` — the two sides of that comparison are otherwise not
   * expressed in the same unit.
   *
   * `minYears` absent is read as 0. `maxYears` absent or null means open-ended
   * ("15+ years"). A level with neither cannot be compared at all, and the
   * ranking pipeline drops the experience signal for candidates sitting on it.
   */
  minYears?: number | null;
  maxYears?: number | null;
}

export enum EXPERIENCE_LEVEL_ENUM {
  FRESHER = 'FRESHER',
  INTERMEDIATE = 'INTERMEDIATE',
  EXPERT = 'EXPERT',
  LEAD = 'LEAD',
  SPECIALIST = 'SPECIALIST',
}
