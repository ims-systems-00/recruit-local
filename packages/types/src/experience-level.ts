export interface IExperienceLevel {
  name: string;
  description?: string;
  isActive?: boolean;
}

export enum EXPERIENCE_LEVEL_ENUM {
  FRESHER = 'FRESHER',
  INTERMEDIATE = 'INTERMEDIATE',
  EXPERT = 'EXPERT',
  LEAD = 'LEAD',
  SPECIALIST = 'SPECIALIST',
}
