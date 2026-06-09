export enum ValueTypeEnum {
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
  type: ValueTypeEnum;
  label: string;
  isActive?: boolean;
}
