import { ModelNames } from './model-names';

export enum ReactionType {
  LIKE = 'like',
  LOVE = 'love',
  HAHA = 'haha',
  WOW = 'wow',
  SAD = 'sad',
  ANGRY = 'angry',
}

/**
 * Public HTTP shape of a Reaction.
 *
 * All fields are optional because reaction responses are CASL field-sanitized —
 * a caller only receives the fields it is permitted to read. Internal fields
 * (deleteMarker, __v) are omitted. ObjectIds are serialized to strings and dates
 * to ISO. Mirrors PostResponseDto.
 *
 * `tenantId` / `jobProfileId` identify the reactor: exactly one of the pair is
 * set on any reaction created through the API (the owning organisation for an
 * employer, the owning job profile for a candidate).
 */
export interface ReactionResponseDto {
  _id?: string;
  id?: string;
  tenantId?: string | null;
  jobProfileId?: string | null;
  collectionName?: ModelNames; // the reacted-to collection, e.g. 'posts'
  collectionId?: string; // the reacted-to document
  type?: ReactionType;
  createdAt?: string; // ISO
  updatedAt?: string; // ISO
}
