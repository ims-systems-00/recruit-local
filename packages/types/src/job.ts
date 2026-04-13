export type SalaryFixed = {
  mode: 'fixed';
  amount: number;
};

export type SalaryRange = {
  mode: 'range';
  min: number;
  max: number;
};
export type SalaryNegotiable = {
  mode: 'negotiable';
};

export type Salary = SalaryFixed | SalaryRange | SalaryNegotiable;

export type Education = {
  degree: string;
  fieldOfStudy: string;
  gpa?: string;
};

export type Skill = {
  name: string;
  years: number;
};

export type WorkingHours = {
  startTime: string; // "09:00"
  endTime: string; // "17:00"
};

export enum JOBS_STATUS_ENUMS {
  DRAFT = 'draft',
  OPEN = 'open',
  EVALUATION = 'evaluation',
  ARCHIVED = 'archived',
  CLOSED = 'closed',
}

export enum QUERY_TYPE_ENUMS {
  PARAGRAPH = 'paragraph',
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  SHORT_ANSWER = 'short_answer',
}
