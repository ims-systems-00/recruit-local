import { StatusResponseDto } from "@rl/types";
import { IStatusDoc } from "../../../models";

const toIso = (v: unknown): string => (v instanceof Date ? v.toISOString() : (v as string));

export const toStatusResponse = (doc: IStatusDoc): StatusResponseDto => ({
  _id: String(doc._id),
  collectionName: doc.collectionName,
  collectionId: doc.collectionId ? String(doc.collectionId) : null,
  label: doc.label,
  weight: doc.weight ?? 0,
  default: doc.default,
  backgroundColor: doc.backgroundColor ?? "#FFFFFF",
  createdAt: toIso((doc as any).createdAt),
  updatedAt: toIso((doc as any).updatedAt),
});

export const toStatusResponseList = (docs: IStatusDoc[]): StatusResponseDto[] => docs.map(toStatusResponse);
