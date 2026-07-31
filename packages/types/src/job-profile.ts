import { PROFICIENCY } from './enums';
import { FileMediaRefDto } from './file-media';

/**
 * Compact, public shape of the job profile (seeker) that owns another document
 * — embedded on that document's reads so a client can render the author without
 * a second request.
 *
 * Identity only: name, headline-ish detail and avatar. Contact details (email,
 * contactNumber), matching internals (keywords, values, completion, visibility)
 * and everything else stay behind the job-profile endpoint and its own CASL
 * rules. Kept in sync with JOB_PROFILE_SUMMARY_FIELDS in the backend's
 * common/query.
 */
export interface JobProfileSummaryDto {
  _id?: string;
  name?: string;
  summary?: string;
  address?: string;
  jobTitle?: { _id?: string; name?: string }[]; // populated job-title catalog documents
  profileImage?: FileMediaRefDto | null; // populated FileMedia (`src` is the public URL)
}

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
