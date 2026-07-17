export enum POST_TYPE_ENUMS {
  POST = 'post',
  ARTICLE = 'article',
}

export enum POST_STATUS_ENUMS {
  DRAFT = 'draft',
  LIVE = 'live',
}

/**
 * Public HTTP shape of a Post.
 *
 * All fields are optional because post responses are CASL field-sanitized — a
 * caller only receives the fields it is permitted to read. Internal fields
 * (deleteMarker, __v) are omitted. ObjectIds are serialized to strings and dates
 * to ISO. Mirrors JobResponseDto.
 */
export interface PostResponseDto {
  _id?: string;
  id?: string;
  tenantId?: string | null;
  jobProfileId?: string | null;
  title?: string;
  text?: string;
  banner?: string | null;
  images?: string[];
  keywords?: string[];
  type?: POST_TYPE_ENUMS;
  status?: POST_STATUS_ENUMS;
  schedule?: string | null; // ISO
  createdAt?: string; // ISO
  updatedAt?: string; // ISO
}
