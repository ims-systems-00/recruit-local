export type ApplicantStatus = 'Started' | 'In Progress' | 'On Going';

export interface Column {
  id: string;
  title: string;
}

export interface Applicant {
  id: string;
  num: string;
  name: string;
  email: string;
  status: ApplicantStatus;
  appliedDate: string;
  appliedTime: string;
  column: string;
  avatarUrl: string;
}

export const INITIAL_COLUMNS: Column[] = [
  { id: 'new', title: 'New Applicants' },
  { id: 'inProgress', title: 'Invitation In Progress' },
  { id: 'sendJoinLink', title: 'Send Join Link' },
];

export const INITIAL_APPLICANTS: Applicant[] = [
  {
    id: '1',
    num: '001',
    name: 'Alifun Nahar',
    email: 'Alifun.Nahar@example.com',
    status: 'Started',
    appliedDate: '26 Jan',
    appliedTime: '3:45 pm',
    column: 'new',
    avatarUrl: 'https://i.pravatar.cc/48?img=47',
  },
  {
    id: '2',
    num: '002',
    name: 'Cody Fisher',
    email: 'elena@example.com',
    status: 'Started',
    appliedDate: '26 Jan',
    appliedTime: '3:45 pm',
    column: 'new',
    avatarUrl: 'https://i.pravatar.cc/48?img=11',
  },
  {
    id: '3',
    num: '003',
    name: 'Devon Lane',
    email: 'elena@example.com',
    status: 'Started',
    appliedDate: '26 Jan',
    appliedTime: '3:45 pm',
    column: 'new',
    avatarUrl: 'https://i.pravatar.cc/48?img=32',
  },
  {
    id: '4',
    num: '004',
    name: 'Mira Alif',
    email: 'elena@example.com',
    status: 'In Progress',
    appliedDate: '26 Jan',
    appliedTime: '3:45 pm',
    column: 'inProgress',
    avatarUrl: 'https://i.pravatar.cc/48?img=15',
  },
  {
    id: '5',
    num: '005',
    name: 'Wade Warren',
    email: 'elena@example.com',
    status: 'In Progress',
    appliedDate: '26 Jan',
    appliedTime: '3:45 pm',
    column: 'inProgress',
    avatarUrl: 'https://i.pravatar.cc/48?img=68',
  },
  {
    id: '6',
    num: '006',
    name: 'Esther Howard',
    email: 'elena@example.com',
    status: 'In Progress',
    appliedDate: '26 Jan',
    appliedTime: '3:45 pm',
    column: 'inProgress',
    avatarUrl: 'https://i.pravatar.cc/48?img=23',
  },
  {
    id: '7',
    num: '007',
    name: 'Marvin McKinney',
    email: 'elena@example.com',
    status: 'In Progress',
    appliedDate: '26 Jan',
    appliedTime: '3:45 pm',
    column: 'inProgress',
    avatarUrl: 'https://i.pravatar.cc/48?img=60',
  },
  {
    id: '8',
    num: '008',
    name: 'Mira Alif',
    email: 'elena@example.com',
    status: 'On Going',
    appliedDate: '26 Jan',
    appliedTime: '3:45 pm',
    column: 'sendJoinLink',
    avatarUrl: 'https://i.pravatar.cc/48?img=15',
  },
];
