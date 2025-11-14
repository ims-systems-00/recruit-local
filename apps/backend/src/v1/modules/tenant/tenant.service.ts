import { PipelineStage } from "mongoose";
import { S3Client } from "@aws-sdk/client-s3";
import { NotFoundException, FileManager, getGeoLocationFromAddress } from "../../../common/helper";
import { Tenant, TenantInput, ITenantDoc, User } from "../../../models";
import { IListTenantParams, IListUsersParams } from "./tenant.interface";
import {
  getMatchAggregatorQueryForList,
  getAuditAggregatorQueryForList,
  getMembershipAggregatorQueryForList,
  getProcessingAggregatorQueryForList,
  getMatchAggregatorQuery,
  getProcessingAggregatorQuery,
} from "./tenant.query";

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET,
  },
  region: "eu-west-2",
});

const setGeoLocation = async (payload: Partial<ITenantDoc>) => {
  const location = await getGeoLocationFromAddress(payload.addressInMap);
  if (location.length === 0) return;

  const [{ latitude, longitude }] = location;
  payload.addressInMapLat = latitude;
  payload.addressInMapLng = longitude;

  return payload;
};

export const listTenant = ({ query = {}, options }: IListTenantParams) => {
  const pipeline: PipelineStage[] = [
    ...getMatchAggregatorQueryForList(query),
    ...getAuditAggregatorQueryForList(),
    ...getMembershipAggregatorQueryForList(),
    ...getProcessingAggregatorQueryForList(),
  ];

  const aggregate = Tenant.aggregate(pipeline);

  return Tenant.aggregatePaginate(aggregate, options);
};

export const getTenant = async (id: string) => {
  const tenant = await Tenant.findOneWithExcludeDeleted({ _id: id });
  if (!tenant) throw new NotFoundException("Tenant not found.");

  return tenant;
};

export const updateTenant = async (id: string, payload: Partial<TenantInput>) => {
  await getTenant(id);
  if (payload.addressInMap) await setGeoLocation(payload);

  const updatedTenant = await Tenant.findOneAndUpdate({ _id: id }, payload, { new: true });

  return updatedTenant;
};

export const updateTenantLogo = async (
  id: string,
  logoStorage: "logoSquareStorage" | "logoRectangleStorage",
  payload: Partial<TenantInput>
) => {
  const tenant = await getTenant(id);
  const fileManager = new FileManager(s3Client);

  // delete the previous file from s3
  if (typeof tenant[logoStorage].Key === "string") {
    const { Bucket, Key } = tenant[logoStorage];
    fileManager.deleteFile({ Bucket, Key });
  }

  if (typeof payload[logoStorage].Key === "string") {
    const logoSrc = process.env.PUBLIC_MEDIA_BASE_URL + "/" + payload[logoStorage].Key;

    if (logoStorage === "logoSquareStorage") {
      payload.logoSquareSrc = logoSrc;
    }
    if (logoStorage === "logoRectangleStorage") {
      payload.logoRectangleSrc = logoSrc;
    }
  }

  return Tenant.findOneAndUpdate({ _id: id }, payload, { new: true });
};

export const createTenant = async (payload: TenantInput) => {
  if (payload.addressInMap) await setGeoLocation(payload);

  const tenant = new Tenant(payload);
  return tenant.save();
};

export const softRemoveTenant = async (id: string) => {
  const tenant = await getTenant(id);
  const { deleted } = await Tenant.softDelete({ _id: id });

  return { tenant, deleted };
};

export const hardRemoveTenant = async (id: string) => {
  const tenant = await getTenant(id);
  await Tenant.findOneAndDelete({ _id: id });

  return tenant;
};
export const bulkRemoveTenants = async (ids: string[]) => {
  // todo: it will use the single hard remove function
  return await Tenant.deleteMany({ _id: { $in: ids } });
};
export const restoreTenant = async (id: string) => {
  const { restored } = await Tenant.restore({ _id: id });
  if (!restored) throw new NotFoundException("Tenant not found in trash.");

  const tenant = await getTenant(id);

  return { tenant, restored };
};

export const getAllUsersByTenantId = async ({ query = {}, options }: IListUsersParams) => {
  const pipeline: PipelineStage[] = [...getMatchAggregatorQuery(query), ...getProcessingAggregatorQuery()];

  const aggregate = User.aggregate(pipeline);
  return User.aggregatePaginate(aggregate, options);
};
