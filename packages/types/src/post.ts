import { FileMediaRefDto } from './file-media';
import { TenantSummaryDto } from './tenant';
import { JobProfileSummaryDto } from './job-profile';
import { ReactionType } from './reaction';

export enum POST_TYPE_ENUMS {
  POST = 'post',
  ARTICLE = 'article',
}

export enum POST_STATUS_ENUMS {
  DRAFT = 'draft',
  LIVE = 'live',
}

/** Which side of the platform authored a post. */
export enum POST_CREATOR_TYPE {
  TENANT = 'tenant',
  JOB_PROFILE = 'jobProfile',
}

/**
 * The populated author of a post — an organisation (recruiter) or a job profile
 * (seeker), matching whichever of `tenantId` / `jobProfileId` the post carries.
 *
 * Discriminated on `type`. Both variants expose `_id`, `name` and `profileImage`,
 * so an author card can render from those without branching; narrow on `type`
 * to reach the side-specific detail (a tenant's industry and logos, a seeker's
 * job titles).
 */
export type PostCreatorDto =
  | ({ type: POST_CREATOR_TYPE.TENANT } & TenantSummaryDto)
  | ({ type: POST_CREATOR_TYPE.JOB_PROFILE } & JobProfileSummaryDto);

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
  creator?: PostCreatorDto | null; // populated author (null if the owning tenant/profile is gone)
  title?: string;
  text?: string;
  banner?: FileMediaRefDto | null; // populated FileMedia (`src` is the public URL)
  images?: FileMediaRefDto[]; // populated FileMedia, in the order stored on the post
  keywords?: string[];
  type?: POST_TYPE_ENUMS;
  status?: POST_STATUS_ENUMS;
  schedule?: string | null; // ISO
  /**
   * The viewer's own reaction on this post, or `null` when they have not
   * reacted. Carries the reaction type rather than a bare boolean so a client
   * can render the right emoji without a second request; it still truthy-checks
   * like a flag. Always `null` for a caller with no tenant/job-profile context.
   */
  alreadyReacted?: ReactionType | null;
  /**
   * Id of the reaction `alreadyReacted` describes, so a client can undo it with
   * `DELETE /reactions/:id/soft` without first looking it up. `null` whenever
   * `alreadyReacted` is.
   */
  alreadyReactedId?: string | null;
  /** Whether the viewer has favourited (saved) this post. */
  alreadySaved?: boolean;
  /**
   * Id of that favourite, for undo via `DELETE /favourites/:id/soft`. `null`
   * when `alreadySaved` is false.
   */
  alreadySavedId?: string | null;
  /** Total number of reactions on this post, across every reactor and type. */
  reactionCount?: number;
  createdAt?: string; // ISO
  updatedAt?: string; // ISO
}
