export enum VISIBILITY_ENUM {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

/**
 * Populated file-media reference exposed on a response (e.g. a profile or cover
 * photo). Present only when the aggregation looked it up; `src` is the public
 * URL for PUBLIC media and null otherwise.
 */
export interface FileMediaRefDto {
  _id: string;
  src?: string | null;
  visibility?: VISIBILITY_ENUM;
  storageInformation?: {
    Name?: string;
    Bucket?: string;
    Key?: string;
  };
  thumbnail?: {
    Name?: string;
    Bucket?: string;
    Key?: string;
  };
}
