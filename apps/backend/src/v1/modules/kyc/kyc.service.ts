import { ClientSession, Types } from "mongoose";
import { withTransaction } from "../../../common/helper/database-transaction";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { NotFoundException } from "../../../common/helper";
import { Kyc, User } from "../../../models";
import { IKycCreateParams, IKycGetParams, IKycListQueryParams, IKycUpdateParams } from "./kyc.interface";
import { kycProjectionQuery, populateKycDocumentsQuery } from "./kyc.query";
import * as FileMediaService from "../file-media/file-media.service";
import { modelNames } from "../../../models/constants";
import { VISIBILITY_ENUM } from "@rl/types";

export const list = ({ query = {}, options, session }: IKycListQueryParams) => {
  const aggregate = Kyc.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...populateKycDocumentsQuery(),
    ...kycProjectionQuery(),
  ]);

  if (session) aggregate.session(session);

  return Kyc.aggregatePaginate(aggregate, options);
};

export const getOne = async ({ query = {}, session }: IKycGetParams) => {
  const aggregate = Kyc.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...populateKycDocumentsQuery(),
    ...kycProjectionQuery(),
  ]);

  if (session) aggregate.session(session);

  const kycs = await aggregate;
  if (kycs.length === 0) throw new NotFoundException("KYC record not found.");
  return kycs[0];
};

export const listSoftDeleted = ({ query = {}, options, session }: IKycListQueryParams) => {
  const aggregate = Kyc.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...populateKycDocumentsQuery(),
    ...kycProjectionQuery(),
  ]);

  if (session) aggregate.session(session);

  return Kyc.aggregatePaginate(aggregate, options);
};

export const getOneSoftDeleted = async ({ query = {}, session }: IKycGetParams) => {
  const aggregate = Kyc.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...populateKycDocumentsQuery(),
    ...kycProjectionQuery(),
  ]);

  if (session) aggregate.session(session);

  const kycs = await aggregate;
  if (kycs.length === 0) throw new NotFoundException("KYC record not found in trash.");
  return kycs[0];
};

export const create = async ({ payload, session }: IKycCreateParams) => {
  return withTransaction(async (txSession: ClientSession) => {
    const activeSession = session || txSession;
    const kycId = new Types.ObjectId();

    const { documentFrontStorage, documentBackStorage, ...cleanPayload } = payload;

    let documentFrontId: Types.ObjectId | undefined;
    let documentBackId: Types.ObjectId | undefined;

    if (documentFrontStorage) {
      const frontFileMedia = await FileMediaService.create({
        payload: {
          collectionName: modelNames.KYC,
          collectionDocument: kycId,
          storageInformation: documentFrontStorage,
          visibility: VISIBILITY_ENUM.PRIVATE,
        },
      });
      documentFrontId = frontFileMedia._id as Types.ObjectId;
    }

    if (documentBackStorage) {
      const backFileMedia = await FileMediaService.create({
        payload: {
          collectionName: modelNames.KYC,
          collectionDocument: kycId,
          storageInformation: documentBackStorage,
          visibility: VISIBILITY_ENUM.PRIVATE,
        },
      });
      documentBackId = backFileMedia._id as Types.ObjectId;
    }

    const kyc = new Kyc({
      ...cleanPayload,
      _id: kycId,
      documentFrontId,
      documentBackId,
    });

    await kyc.save({ session: activeSession });

    await User.findOneAndUpdate(
      { _id: payload.userId },
      { $set: { kycStatus: kyc.status } },
      { new: true, session: activeSession }
    );

    return getOne({ query: { _id: kyc._id!.toString() }, session: activeSession });
  });
};

export const update = async ({ query, payload, session }: IKycUpdateParams) => {
  return withTransaction(async (txSession: ClientSession) => {
    const activeSession = session || txSession;
    const sanitizedQuery = sanitizeQueryIds(query);
    const kyc = await getOne({ query: sanitizedQuery, session: activeSession });

    const { documentFrontStorage, documentBackStorage, ...cleanPayload } = payload;

    let updatedDocumentFrontId = kyc.documentFrontId ? new Types.ObjectId(kyc.documentFrontId.toString()) : undefined;
    let updatedDocumentBackId = kyc.documentBackId ? new Types.ObjectId(kyc.documentBackId.toString()) : undefined;

    if (documentFrontStorage) {
      const frontFileMedia = await FileMediaService.create({
        payload: {
          collectionName: modelNames.KYC,
          collectionDocument: kyc._id,
          storageInformation: documentFrontStorage,
          visibility: VISIBILITY_ENUM.PUBLIC,
        },
      });

      if (kyc.documentFrontId) {
        try {
          await FileMediaService.hardDelete({ query: { _id: kyc.documentFrontId.toString() } });
        } catch (error) {
          console.error(`Failed to delete old KYC front document ${kyc.documentFrontId}`, error);
        }
      }

      updatedDocumentFrontId = frontFileMedia._id as Types.ObjectId;
    }

    if (documentBackStorage) {
      const backFileMedia = await FileMediaService.create({
        payload: {
          collectionName: modelNames.KYC,
          collectionDocument: kyc._id,
          storageInformation: documentBackStorage,
          visibility: VISIBILITY_ENUM.PRIVATE,
        },
      });

      if (kyc.documentBackId) {
        try {
          await FileMediaService.hardDelete({ query: { _id: kyc.documentBackId.toString() } });
        } catch (error) {
          console.error(`Failed to delete old KYC back document ${kyc.documentBackId}`, error);
        }
      }

      updatedDocumentBackId = backFileMedia._id as Types.ObjectId;
    }

    const updatedKyc = await Kyc.findOneAndUpdate(
      { _id: kyc._id },
      {
        $set: {
          ...cleanPayload,
          documentFrontId: updatedDocumentFrontId,
          documentBackId: updatedDocumentBackId,
        },
      },
      { new: true, runValidators: true, session: activeSession }
    );

    if (!updatedKyc) throw new NotFoundException("KYC record not found.");

    if (payload.status) {
      await User.findOneAndUpdate(
        { _id: kyc.userId },
        { $set: { kycStatus: payload.status } },
        { new: true, session: activeSession }
      );
    }

    return getOne({ query: { _id: updatedKyc._id!.toString() }, session: activeSession });
  });
};

export const softDelete = async ({ query, session }: IKycGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const { deleted } = await Kyc.softDelete(sanitizedQuery, { session });

  if (!deleted) throw new NotFoundException("KYC record not found to delete.");
  return { deleted };
};

export const hardDelete = async ({ query, session }: IKycGetParams) => {
  return withTransaction(async (txSession: ClientSession) => {
    const activeSession = session || txSession;
    const sanitizedQuery = sanitizeQueryIds(query);
    const kyc = await getOneSoftDeleted({ query: sanitizedQuery, session: activeSession });

    const deletedKyc = await Kyc.findOneAndDelete({ _id: kyc._id }, { session: activeSession });
    if (!deletedKyc) throw new NotFoundException("KYC record not found to delete.");
    return kyc;
  });
};

export const restore = async ({ query, session }: IKycGetParams) => {
  return withTransaction(async (txSession: ClientSession) => {
    const activeSession = session || txSession;
    const sanitizedQuery = sanitizeQueryIds(query);
    const { restored } = await Kyc.restore(sanitizedQuery, { session: activeSession });

    if (!restored) throw new NotFoundException("KYC record not found in trash.");
    return getOne({ query: sanitizedQuery, session: activeSession });
  });
};
