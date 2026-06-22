export enum VALUE_TYPE_ENUM {
  GROWTH = 'growth',
  LEARNING = 'learning',
  CHALLENGE = 'challenge',
  INNOVATION = 'innovation',
  WORK = 'work',
  COMMUNICATE = 'communicate',
  ORGANIZE = 'organize',
  CONTRIBUTE = 'contribute',
  INTERPERSONAL = 'interpersonal',
  ETHICAL = 'ethical',
  SOCIAL = 'social',
  PERFORMANCE = 'performance',
  DEVELOPMENT = 'development',
  COLLABORATION = 'collaboration',
  MOTIVATION = 'motivation',
  MEANING = 'meaning',
  FULFILMENT = 'fulfilment',
}

export interface IValue {
  type: VALUE_TYPE_ENUM;
  label: string;
  isActive?: boolean;
}
