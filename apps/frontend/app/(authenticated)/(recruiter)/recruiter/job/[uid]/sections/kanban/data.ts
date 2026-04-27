export type ApplicantStatus = 'Started' | 'In Progress' | 'On Going';

export interface Column {
  id: string;
  title: string;
}

export const INITIAL_COLUMNS: Column[] = [
  { id: 'new', title: 'New Applicants' },
  { id: 'inProgress', title: 'Invitation In Progress' },
  { id: 'sendJoinLink', title: 'Send Join Link' },
];
