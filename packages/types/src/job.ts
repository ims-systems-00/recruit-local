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
