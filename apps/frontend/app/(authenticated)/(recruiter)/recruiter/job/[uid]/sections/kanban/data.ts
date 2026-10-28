export type ApplicantStatus = 'Started' | 'In Progress' | 'On Going';

export interface Column {
  id: string;
  title: string;
  /** The job's default stage: where new applications land, read best match first. */
  isDefault?: boolean;
}

export const INITIAL_COLUMNS: Column[] = [
  { id: 'new', title: 'New Applicants' },
  { id: 'inProgress', title: 'Invitation In Progress' },
  { id: 'sendJoinLink', title: 'Send Join Link' },
];
