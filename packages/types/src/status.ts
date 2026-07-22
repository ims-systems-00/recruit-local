import { ModelNames } from './model-names';

/** Public HTTP shape of a Status. Internal fields (deleteMarker, __v) are intentionally omitted. */
export interface StatusResponseDto {
  _id: string;
  collectionName: ModelNames;
  collectionId?: string | null;
  label: string;
  weight: number;
  default: boolean;
  backgroundColor: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}
