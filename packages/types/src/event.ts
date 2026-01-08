export enum EVENT_STATUS_ENUMS {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum EVENT_MODE_ENUMS {
  IN_PERSON = 'in_person',
  VIRTUAL = 'virtual',
  HYBRID = 'hybrid',
}

export enum EVENT_TYPE_ENUMS {
  WORKSHOP = 'workshop',
  SEMINAR = 'seminar',
  CONFERENCE = 'conference',
  MEETUP = 'meetup',
  JOB_FAIR = 'job_fair',
  NETWORKING = 'networking',
  CAREER_DEVELOPMENT = 'career_development',
  MENTORSHIP = 'mentorship',
  OTHER = 'other',
}

export type VirtualEvent = {
  link: string;
  id?: string;
  password?: string;
};
