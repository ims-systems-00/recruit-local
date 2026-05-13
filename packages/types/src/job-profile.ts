import { PROFICIENCY } from './enums';

export interface language {
  name: string;
  proficiencyLevel: PROFICIENCY;
}

export enum JOB_PROFILE_STATUS_ENUM {
  VERIFIED = 'verified',
  UNVERIFIED = 'unverified',
}

export enum JOB_TITLE_ENUMS {
  SOFTWARE_ENGINEER = 'Software Engineer',
  DATA_SCIENTIST = 'Data Scientist',
  PRODUCT_MANAGER = 'Product Manager',
  DESIGNER = 'Designer',
  MARKETING_SPECIALIST = 'Marketing Specialist',
  SALES_REPRESENTATIVE = 'Sales Representative',
  CUSTOMER_SUPPORT = 'Customer Support',
  HUMAN_RESOURCES = 'Human Resources',
  FINANCE_ANALYST = 'Finance Analyst',
  BUSINESS_ANALYST = 'Business Analyst',
}
