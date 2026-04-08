/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClientSession } from "mongoose";
import { S3Client } from "@aws-sdk/client-s3";
import { NotFoundException, FileManager } from "../../../common/helper";
import { Tenant, ITenantDoc } from "../../../models";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { tenantProjectionQuery } from "./tenant.query";
import {
  IListTenantParams,
  ITenantGetParams,
  ITenantUpdateParams,
  ITenantCreateParams,
  ITenantUpdateLogoParams,
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

export const list = ({ query = {}, options, session }: IListTenantParams) => {
  const aggregate = Tenant.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...tenantProjectionQuery(),
  ]);

  if (session) aggregate.session(session);

  return Tenant.aggregatePaginate(aggregate, options);
};

export const getOne = async ({ query = {}, session }: ITenantGetParams): Promise<ITenantDoc> => {
  const aggregate = Tenant.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
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
  let tenant = new Tenant(payload);
  tenant = await tenant.save({ session });
  return tenant;
};

export const update = async ({ query, payload, session }: ITenantUpdateParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const existing = await getOne({ query: sanitizedQuery, session });

  const updatedTenant = await Tenant.findOneAndUpdate(
    { _id: existing._id },
    { $set: payload },
    { new: true, runValidators: true, session }
  );

  if (!updatedTenant) throw new NotFoundException("Tenant not found for update.");
  return updatedTenant;
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
