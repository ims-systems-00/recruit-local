import { ClientSession, PipelineStage } from "mongoose";
import { S3Client } from "@aws-sdk/client-s3";
import { NotFoundException, FileManager } from "../../../common/helper";
import { Tenant, TenantInput, ITenantDoc } from "../../../models";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { withTransaction } from "../../../common/helper/database-transaction";
import { IListParams, ListQueryParams } from "@rl/types";
import { matchQuery, excludeDeletedQuery } from "../../../common/query";
import { tenantProjectionQuery } from "./tenant.query";

// --- Standardized Parameter Interfaces ---
type ITenantListParams = IListParams<TenantInput>;
type ITenantQueryParams = ListQueryParams<TenantInput>;

export interface ITenantUpdateParams {
  query: ITenantQueryParams;
  payload: Partial<TenantInput>;
}

export interface ITenantUpdateLogoParams {
  query: ITenantQueryParams;
  logoStorage: "logoSquareStorage" | "logoRectangleStorage";
  payload: Partial<TenantInput>;
}

export interface ITenantGetParams {
  query: ITenantQueryParams;
  session?: ClientSession;
}

export interface ITenantCreateParams {
  payload: TenantInput;
}

export interface ITenantBulkParams {
  ids: string[];
}

// --- S3 & Helper Setup ---
const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY as string,
    secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET as string,
  },
  region: "eu-west-2",
});

// const setGeoLocation = async (payload: Partial<ITenantDoc> | Partial<TenantInput>) => {
//   if (!payload.addressInMap) return;

//   const location = await getGeoLocationFromAddress(payload.addressInMap);
//   if (location.length === 0) return;

//   const [{ latitude, longitude }] = location;
//   payload.addressInMapLat = latitude;
//   payload.addressInMapLng = longitude;

//   return payload;
// };

// --- Service Methods ---

export const list = ({ query = {}, options }: ITenantListParams) => {
  const pipeline: PipelineStage[] = [
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...tenantProjectionQuery(),
  ];
  return Tenant.aggregatePaginate(pipeline, options);
};

export const getOne = async ({ query = {}, session }: ITenantGetParams): Promise<ITenantDoc> => {
  const pipeline: PipelineStage[] = [
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...tenantProjectionQuery(),
  ];

  const tenant = await Tenant.aggregate(pipeline).session(session || null);

  if (tenant.length === 0) throw new NotFoundException("Tenant not found.");
  return tenant[0];
};

export const create = async ({ payload }: ITenantCreateParams) => {
  return withTransaction(async (session: ClientSession) => {
    const tenant = new Tenant(payload);
    await tenant.save({ session });

    return tenant;
  });
};

export const update = async ({ query, payload }: ITenantUpdateParams) => {
  return withTransaction(async (session: ClientSession) => {
    const sanitizedQuery = sanitizeQueryIds(query);
    const existing = await Tenant.findOne(sanitizedQuery).session(session);

    if (!existing) throw new NotFoundException("Tenant not found for update.");

    const updatedTenant = await Tenant.findOneAndUpdate(
      { _id: existing._id },
      { $set: payload },
      { new: true, runValidators: true, session }
    );

    return updatedTenant;
  });
};

export const updateLogo = async ({ query, logoStorage, payload }: ITenantUpdateLogoParams) => {
  return withTransaction(async (session: ClientSession) => {
    const tenant = await getOne({ query, session });
    const fileManager = new FileManager(s3Client);

    // delete the previous file from s3
    if (tenant[logoStorage] && typeof tenant[logoStorage].Key === "string") {
      const { Bucket, Key } = tenant[logoStorage] as any;
      fileManager.deleteFile({ Bucket, Key });
    }

    if (payload[logoStorage] && typeof payload[logoStorage].Key === "string") {
      const logoSrc = process.env.PUBLIC_MEDIA_BASE_URL + "/" + payload[logoStorage].Key;

      if (logoStorage === "logoSquareStorage") {
        payload.logoSquareSrc = logoSrc;
      }
      if (logoStorage === "logoRectangleStorage") {
        payload.logoRectangleSrc = logoSrc;
      }
    }

    const updatedTenant = await Tenant.findOneAndUpdate(
      { _id: tenant._id },
      { $set: payload },
      { new: true, runValidators: true, session }
    );

    return updatedTenant;
  });
};

export const softDelete = async ({ query }: ITenantGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const tenant = await Tenant.findOne(sanitizedQuery);

  if (!tenant) throw new NotFoundException("Tenant not found.");

  const { deleted } = await Tenant.softDelete({ _id: tenant._id });

  return { tenant, deleted };
};

export const hardDelete = async ({ query, session }: ITenantGetParams) => {
  return withTransaction(async (sessionTx) => {
    const activeSession = session || sessionTx;
    const sanitizedQuery = sanitizeQueryIds(query);

    const tenant = await Tenant.findOne(sanitizedQuery).session(activeSession);
    if (!tenant) throw new NotFoundException("Tenant not found.");

    await Tenant.deleteOne({ _id: tenant._id }).session(activeSession);
    return tenant;
  });
};

export const bulkHardDelete = async ({ ids }: ITenantBulkParams) => {
  // Addressed TODO: Utilizing the single hard remove function within a transaction
  return withTransaction(async (session: ClientSession) => {
    const results = [];
    for (const id of ids) {
      // Pass the session down to ensure the entire bulk operation is transactional
      results.push(await hardDelete({ query: { _id: id }, session }));
    }
    return results;
  });
};

export const restore = async ({ query }: ITenantGetParams) => {
  return withTransaction(async (session: ClientSession) => {
    const sanitizedQuery = sanitizeQueryIds(query);

    // Check if it exists in trash
    const { restored } = await Tenant.restore(sanitizedQuery);
    if (!restored) throw new NotFoundException("Tenant not found in trash.");

    // Fetch the restored tenant
    const tenant = await Tenant.findOne(sanitizedQuery).session(session);
    return { tenant, restored };
  });
};

// export const getAllUsersByTenantId = async ({ query = {}, options }: IListParams<any>) => {
//   const sanitizedQuery = sanitizeQueryIds(query);

//   const pipeline: PipelineStage[] = [...getMatchAggregatorQuery(sanitizedQuery), ...getProcessingAggregatorQuery()];

//   // Assuming User model has aggregatePaginate attached
//   return User.aggregatePaginate(User.aggregate(pipeline), options);
// };
