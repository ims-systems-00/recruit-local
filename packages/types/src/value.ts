export enum VALUE_TYPE_ENUM {
  WORKING_STYLE = 'working-style',
  MINDSET = 'mindset',
  CULTURE_AND_BEHAVIOR = 'culture-and-behavior',
  LEADERSHIP = 'leadership',
  MOTIVATION = 'motivation',
}

export interface IValue {
  type: VALUE_TYPE_ENUM;
  label: string;
  isActive?: boolean;
}

/**
 * Public HTTP shape of a populated value document, as returned embedded in a
 * parent (e.g. a tenant's `values`). ObjectId is a string, dates are ISO, and
 * internal bookkeeping fields are dropped.
 */
export interface ValueResponseDto {
  _id: string;
  type: VALUE_TYPE_ENUM;
  label: string;
  isActive?: boolean;
}
