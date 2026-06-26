export enum VALUE_TYPE_ENUM {
  WORKING_STYLE = 'working-style',
  MINDSET = 'mindset',
  CULTURE_AND_BEHAVIOR = 'culture-and-behavior',
  LEADERSHIP = 'leadership',
  TEAM_DYNAMICS = 'team-dynamics',
}

export interface IValue {
  type: VALUE_TYPE_ENUM;
  label: string;
  isActive?: boolean;
}
