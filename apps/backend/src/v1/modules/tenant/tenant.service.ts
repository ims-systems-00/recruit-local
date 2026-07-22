/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClientSession, Types } from "mongoose";
import { S3Client } from "@aws-sdk/client-s3";
import { VISIBILITY_ENUM } from "@rl/types";
import { NotFoundException, FileManager } from "../../../common/helper";
import { Tenant, ITenantDoc } from "../../../models";
import { modelNames } from "../../../models/constants";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery, populateFileMediaQuery } from "../../../common/query";
import { valueWeightUpdateQueue } from "../../../queue/valueWeightUpdateQueue";
import { enqueueTenantKeywords } from "../../../queue/keywordUpdateQueue";
import * as FileMediaService from "../file-media/file-media.service";
import { recomputeTenantCompletion } from "./tenant-completion.service";
import { tenantProjectionQuery } from "./tenant.query";
import { populateValuesQuery } from "../value/value.query";
import {
  IListTenantParams,
  ITenantGetParams,
  ITenantUpdateParams,
  ITenantCreateParams,
  ITenantUpdateLogoParams,
  ITenantPhotoStorage,
} from "./tenant.interface";

export interface ITenantBulkParams {
  ids: string[];
  session?: ClientSession;
}

// --- S3 & Helper Setup ---
const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY as string,
    secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET as string,
  },
  region: "eu-west-2",
});

// --- Service Methods ---

// Photo fields that are uploaded as an inline `*Storage` template and persisted
// as a FileMedia ObjectId reference.
const PHOTO_STORAGE_FIELDS: { storageKey: keyof ITenantPhotoStorage; idKey: "profileImageId" | "coverPhotoId" }[] = [
  { storageKey: "profileImageStorage", idKey: "profileImageId" },
  { storageKey: "coverPhotoStorage", idKey: "coverPhotoId" },
];

/**
 * Resolves any inline photo upload templates on a write payload into FileMedia
 * documents: for each provided `*Storage`, creates a FileMedia (or clears the
 * ref when `null`), writes the new id into the matching `*Id` field, hard-deletes
 * the FileMedia it replaces, and returns a clean payload with the transient
 * `*Storage` keys removed (safe to persist).
 */
const resolvePhotoStorage = async (
  tenantId: Types.ObjectId,
  payload: ITenantUpdateParams["payload"],
  existing?: ITenantDoc
): Promise<Partial<ITenantDoc>> => {
  const { profileImageStorage, coverPhotoStorage, ...clean } = payload;
  const storageByKey: ITenantPhotoStorage = { profileImageStorage, coverPhotoStorage };

  for (const { storageKey, idKey } of PHOTO_STORAGE_FIELDS) {
    const storage = storageByKey[storageKey];
    if (storage === undefined) continue; // field not part of this write

    let newId: Types.ObjectId | null = null;
    if (storage) {
      const fileMedia = await FileMediaService.create({
        payload: {
          collectionName: modelNames.TENANT,
          collectionDocument: tenantId,
          storageInformation: storage,
          visibility: VISIBILITY_ENUM.PUBLIC,
        },
      });
      newId = fileMedia._id as Types.ObjectId;
    }
    (clean as any)[idKey] = newId;

    // Remove the FileMedia this write replaces (non-fatal on error).
    const previousId = existing?.[idKey];
    if (previousId) {
      try {
        await FileMediaService.hardDelete({ query: { _id: previousId.toString() } });
      } catch (error) {
        console.error(`Failed to delete old ${idKey} for Tenant ${tenantId}`, error);
      }
    }
  }

  return clean as Partial<ITenantDoc>;
};

export const list = ({ query = {}, options, session }: IListTenantParams) => {
  const aggregate = Tenant.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...populateValuesQuery(),
    ...populateFileMediaQuery("profileImageId", "profileImage"),
    ...populateFileMediaQuery("coverPhotoId", "coverPhoto"),
    ...tenantProjectionQuery(),
  ]);

  if (session) aggregate.session(session);

  return Tenant.aggregatePaginate(aggregate, options);
};

export const getOne = async ({ query = {}, session }: ITenantGetParams): Promise<ITenantDoc> => {
  const aggregate = Tenant.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...populateValuesQuery(),
    ...populateFileMediaQuery("profileImageId", "profileImage"),
    ...populateFileMediaQuery("coverPhotoId", "coverPhoto"),
    ...tenantProjectionQuery(),
  ]);

  if (session) aggregate.session(session);

  const tenants = await aggregate;

  if (tenants.length === 0) throw new NotFoundException("Tenant not found.");
  return tenants[0] as unknown as ITenantDoc;
};

export const listSoftDeleted = async ({ query = {}, options, session }: IListTenantParams) => {
  const aggregate = Tenant.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...tenantProjectionQuery(),
  ]);

  if (session) aggregate.session(session);

  return Tenant.aggregatePaginate(aggregate, options);
};

export const getOneSoftDeleted = async ({ query = {}, session }: ITenantGetParams): Promise<ITenantDoc> => {
  const aggregate = Tenant.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...tenantProjectionQuery(),
  ]);

  if (session) aggregate.session(session);

  const tenants = await aggregate;

  if (tenants.length === 0) throw new NotFoundException("Tenant not found in trash.");
  return tenants[0] as unknown as ITenantDoc;
};

export const create = async ({ payload, session }: ITenantCreateParams) => {
  const tenantId = new Types.ObjectId();
  const cleanPayload = await resolvePhotoStorage(tenantId, payload);

  let tenant = new Tenant({ ...cleanPayload, _id: tenantId });
  tenant = await tenant.save({ session });

  // Bump the weight of every value attached to the tenant.
  if (tenant.values?.length) {
    const valueIds = tenant.values.map((id) => id.toString());
    await valueWeightUpdateQueue.addJob("value-weight-update", { valueIds });
  }

  const completion = await recomputeTenantCompletion(String(tenant._id));
  if (completion) tenant.completion = completion;

  // Rebuild match keywords off the request path (tenants receive matched posts).
  await enqueueTenantKeywords(tenant._id);

  return tenant;
};

export const update = async ({ query, payload, session }: ITenantUpdateParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const existing = await getOne({ query: sanitizedQuery, session });

  const cleanPayload = await resolvePhotoStorage(existing._id as Types.ObjectId, payload, existing);

  const updatedTenant = await Tenant.findOneAndUpdate(
    { _id: existing._id },
    { $set: cleanPayload },
    { new: true, runValidators: true, session }
  );

  if (!updatedTenant) throw new NotFoundException("Tenant not found for update.");

  // Bump the weight of values newly attached to the tenant.
  if (payload.values?.length) {
    const existingValueIds = new Set<string>((existing.values ?? []).map((id) => id.toString()));
    const newValueIds = payload.values.map((id) => id.toString()).filter((id) => !existingValueIds.has(id));
    if (newValueIds.length) await valueWeightUpdateQueue.addJob("value-weight-update", { valueIds: newValueIds });
  }

  await recomputeTenantCompletion(String(updatedTenant._id));

  // Rebuild match keywords off the request path (retro-matches existing posts).
  await enqueueTenantKeywords(updatedTenant._id);

  // Re-fetch through the read pipeline so the response includes the populated
  // values and profile/cover photos (findOneAndUpdate returns only raw ObjectId
  // refs). Mirrors how the job-profile update service returns its document.
  return getOne({ query: { _id: String(updatedTenant._id) }, session });
};

export const updateLogo = async ({ tenantId, logoType, file, session }: ITenantUpdateLogoParams) => {
  // 1. Fetch the existing tenant
  const tenant = await getOne({ query: { _id: tenantId }, session });
  const fileManager = new FileManager(s3Client);

  // Map the logoType to your specific database fields
  const storageField = logoType === "square" ? "logoSquareStorage" : "logoRectangleStorage";
  const srcField = logoType === "square" ? "logoSquareSrc" : "logoRectangleSrc";

  // 2. Upload the new file to S3
  // NOTE: You will need to ensure your FileManager has an upload method that handles Multer files.
  // I am assuming it returns an object like { Bucket: string, Key: string }
  const uploadedStorageInfo = await fileManager.uploadFileToS3(file);
  const newLogoSrc = `${process.env.PUBLIC_MEDIA_BASE_URL}/${uploadedStorageInfo.Key}`;

  // 3. Delete the previous file from S3 (if it exists)
  if (tenant[storageField] && typeof (tenant[storageField] as any).Key === "string") {
    const { Bucket, Key } = tenant[storageField] as any;
    try {
      await fileManager.deleteFile({ Bucket, Key });
    } catch (error) {
      console.error(`Failed to delete old ${logoType} logo for Tenant ${tenant._id}`, error);
    }
  }

  // 4. Update the database with the new storage info and URL
  const updatedTenant = await Tenant.findOneAndUpdate(
    { _id: tenant._id },
    {
      $set: {
        [storageField]: uploadedStorageInfo,
        [srcField]: newLogoSrc,
      },
    },
    { new: true, runValidators: true, session }
  );

  if (!updatedTenant) throw new NotFoundException("Tenant not found for update.");

  // Logo just changed — branding may now be complete.
  const completion = await recomputeTenantCompletion(String(updatedTenant._id));
  if (completion) updatedTenant.completion = completion;

  return updatedTenant;
};

export const softDelete = async ({ query, session }: ITenantGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const tenantToSoftDelete = await getOne({ query: sanitizedQuery, session });

  const { deleted } = await Tenant.softDelete({ _id: tenantToSoftDelete._id }, { session });
  if (!deleted) throw new NotFoundException("Tenant not found to delete.");

  return { tenant: tenantToSoftDelete, deleted };
};

export const hardDelete = async ({ query, session }: ITenantGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);

  // Verify it exists (even in trash) before hard deleting
  const tenant = await getOneSoftDeleted({ query: sanitizedQuery, session });
  if (!tenant) throw new NotFoundException("Tenant not found to delete.");

  // If you want to delete S3 logos here, you can do it just like updateLogo

  const deletedTenant = await Tenant.findOneAndDelete({ _id: tenant._id }, { session });
  if (!deletedTenant) throw new NotFoundException("Tenant not found to delete.");

  return deletedTenant;
};

export const bulkHardDelete = async ({ ids, session }: ITenantBulkParams) => {
  const results = [];
  for (const id of ids) {
    results.push(await hardDelete({ query: { _id: id }, session }));
  }
  return results;
};

export const restore = async ({ query, session }: ITenantGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);

  const { restored } = await Tenant.restore(sanitizedQuery, { session });
  if (!restored) throw new NotFoundException("Tenant not found in trash.");

  const tenant = await getOne({ query: sanitizedQuery, session });
  return { tenant, restored };
};
