import { WORK_MODE, EMPLOYMENT_TYPE } from './enums';

export interface Experience {
  company: string;
  location?: string;
  workMode?: WORK_MODE;
  employmentType?: EMPLOYMENT_TYPE;
  position: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
}
export interface Education {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
  gpa?: string;
}

export interface Skill {
  name: string;
  proficiencyLevel?: string;
  description?: string;
}

export interface Certification {
  name: string;
  issuingOrganization: string;
  issueDate: Date;
}

export interface language {
  name: string;
  proficiencyLevel: string;
}
