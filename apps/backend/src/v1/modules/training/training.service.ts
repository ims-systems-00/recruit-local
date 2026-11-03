import { Types } from "mongoose";
import { IListParams, ListQueryParams, VISIBILITY_ENUM } from "@rl/types";
import {
  matchQuery,
  excludeDeletedQuery,
  onlyDeletedQuery,
  cursorPageStages,
  toCursorPage,
} from "../../../common/query";
import { BadRequestException, NotFoundException, logger, sanitizeQueryIds } from "../../../common/helper";
import { FileMedia, Training, TrainingInput } from "../../../models";
import { modelNames } from "../../../models/constants";
import { AwsStorageTemplate } from "../../../models/templates/aws-storage.template";
import * as FileMediaService from "../file-media/file-media.service";
import * as skillCatalogService from "../skill-catalog/skill-catalog.service";
import { enqueueProfileCompletion } from "../../../queue/profileCompletionUpdateQueue";
import { s3Client } from "../../../.config/s3.config";
import { FileInformation, FileManager } from "../../../common/helper/file-manager";
import { populateTrainingCertificateQuery, populateTrainingSkillsQuery, trainingProjectQuery } from "./training.query";

const fileManager = new FileManager(s3Client);

type IListTrainingParams = IListParams<TrainingInput> & { offset?: number };
type ITrainingQueryParams = ListQueryParams<TrainingInput>;

// `certificateStorage` is the uploaded file's S3 location; it becomes a FileMedia
// and only its id is stored on the training.
// On update, null removes the certificate.
type WithCertificate<T> = T & { certificateStorage?: AwsStorageTemplate | null };

const readStages = () => [
  ...trainingProjectQuery(),
  ...populateTrainingCertificateQuery(),
  ...populateTrainingSkillsQuery(),
];

/**
 * The check on skills that Joi cannot make, because it needs the database: each
 * must be a live, active catalogue entry — the rule a job's and a profile's
 * skills are held to, so the three can be matched.
 *
 * `keep` are the skills the training already has. They pass even if since
 * deactivated: the edit form always sends every skill, and a retired one should
 * not block editing the rest of the training.
 */
const assertSkillsAvailable = async (skills: unknown[] = [], keep: string[] = []) => {
  const ids = skills.map(String).filter((id) => !keep.includes(id));
  if (!ids.length) return;

  const available = new Set((await skillCatalogService.findActiveByIds(ids)).map(({ _id }) => String(_id)));
  const unavailable = ids.filter((id) => !available.has(id));

  if (unavailable.length) {
    throw new BadRequestException(
      `These skills are not in the skill catalogue or are no longer available: ${unavailable.join(", ")}`
    );
  }
};

/**
 * The date rules create enforces in Joi, applied to the training as it will be
 * after an edit — saved values merged with the changes. Joi alone can only
 * compare dates sent in the same request, so an edit sending just an end date,
 * or un-ticking "currently enrolled", would otherwise go unchecked.
 */
const assertDatesAfterUpdate = (
  existing: Pick<TrainingInput, "isCurrentlyEnrolled" | "startDate" | "endDate">,
  changes: Partial<TrainingInput>
) => {
  const isCurrentlyEnrolled = changes.isCurrentlyEnrolled ?? existing.isCurrentlyEnrolled;
  if (isCurrentlyEnrolled) return;

  const startDate = changes.startDate ?? existing.startDate;
  const endDate = changes.endDate ?? existing.endDate;

  if (!endDate) throw new BadRequestException("End Date is required unless currently enrolled.");
  if (new Date(endDate) < new Date(startDate)) {
    throw new BadRequestException("End Date must be on or after the Start Date");
  }
};

// PRIVATE: the upload lands in the private bucket, so a public `src` URL would
// point at a file that is not there. It is opened through `signCertificate`.
const createCertificate = (trainingId: Types.ObjectId, storage: AwsStorageTemplate) =>
  FileMediaService.create({
    payload: {
      collectionName: modelNames.TRAINING,
      collectionDocument: trainingId,
      storageInformation: storage,
      visibility: VISIBILITY_ENUM.PRIVATE,
    },
  });

type CertificateFiles = { storageInformation?: FileInformation; thumbnail?: FileInformation } | null;

const signFile = async (file?: FileInformation) =>
  file?.Bucket && file.Key ? (await fileManager.getSignedUrlForView(file)).signedUrl : null;

/**
 * Short-lived links to a training's certificate and its preview image. Both sit
 * in private storage, so this is the way to open them; the caller checks that
 * the training may be read first. `thumbnailUrl` is null until the preview has
 * been generated.
 */
export const signCertificate = async (training: { certificate?: CertificateFiles }) => {
  const certificate = training.certificate;
  if (!certificate?.storageInformation?.Key) throw new NotFoundException("This training has no certificate.");

  const [url, thumbnailUrl] = await Promise.all([
    signFile(certificate.storageInformation),
    signFile(certificate.thumbnail),
  ]);
  return { url, thumbnailUrl };
};

/**
 * Undoes the certificate record made for a write that then failed, so no record
 * is left pointing at a training that was never saved. Only the record: the
 * uploaded file stays, because the form still holds it and sends it again on a
 * retry — `FileMediaService.hardDelete` would delete the file too.
 */
const discardCertificateRecord = async (certificate: { _id: unknown } | null) => {
  if (!certificate) return;
  try {
    await FileMedia.deleteOne({ _id: certificate._id });
  } catch (error) {
    logger.error(`Failed to discard certificate record ${certificate._id}`, error);
  }
};

// Runs after the training itself is saved or deleted, so a failed cleanup is
// logged rather than failing the request.
const deleteCertificate = async (certificateId?: Types.ObjectId | null) => {
  if (!certificateId) return;
  try {
    await FileMediaService.hardDelete({ query: { _id: certificateId.toString() } });
  } catch (error) {
    logger.error(`Failed to delete training certificate ${certificateId}`, error);
  }
};

export const list = async ({ query = {}, options, offset = 0 }: IListTrainingParams) => {
  const limit = options?.limit && options.limit > 0 ? options.limit : 10;

  const docs = await Training.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...readStages(),
    ...cursorPageStages(options?.sort ? String(options.sort) : undefined, offset, limit),
  ]);

  return toCursorPage(docs, limit);
};

export const getOne = async ({ query = {} }: IListTrainingParams) => {
  const trainings = await Training.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...readStages(),
  ]);
  if (trainings.length === 0) throw new NotFoundException("Training not found.");
  return trainings[0];
};

export const listSoftDeleted = async ({ query = {}, options, offset = 0 }: IListTrainingParams) => {
  const limit = options?.limit && options.limit > 0 ? options.limit : 10;

  const docs = await Training.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...readStages(),
    ...cursorPageStages(options?.sort ? String(options.sort) : undefined, offset, limit),
  ]);

  return toCursorPage(docs, limit);
};

export const getOneSoftDeleted = async ({ query = {} }: IListTrainingParams) => {
  const trainings = await Training.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...readStages(),
  ]);
  if (trainings.length === 0) throw new NotFoundException("Training not found in trash.");
  return trainings[0];
};

export const create = async ({ payload }: { payload: WithCertificate<TrainingInput> }) => {
  const { certificateStorage, ...trainingPayload } = payload;
  // Before the certificate is stored, so a rejected skill leaves no file behind.
  await assertSkillsAvailable(trainingPayload.skills);

  const trainingId = new Types.ObjectId();
  const certificate = certificateStorage ? await createCertificate(trainingId, certificateStorage) : null;

  const training = new Training({
    ...trainingPayload,
    _id: trainingId,
    certificateId: certificate?._id ?? null,
  });
  try {
    await training.save();
  } catch (error) {
    await discardCertificateRecord(certificate);
    throw error;
  }

  // Having a training counts toward profile completion. Only create, soft
  // delete and restore change whether the candidate has one; edits do not.
  await enqueueProfileCompletion(training.userId);

  // Read back through the same stages as every other read, so the response
  // carries skill names and the certificate rather than bare ids.
  return getOne({ query: { _id: String(trainingId) } });
};

export const update = async ({
  query,
  payload,
}: {
  query: ITrainingQueryParams;
  payload: WithCertificate<Partial<TrainingInput>>;
}) => {
  const existing = await getOne({ query });
  const { certificateStorage, ...changes } = payload;

  const existingSkillIds = (existing.skills ?? []).map((skill: { _id: unknown }) => String(skill._id));
  await assertSkillsAvailable(changes.skills, existingSkillIds);
  // Before the certificate is stored, so a rejected edit leaves no file behind.
  assertDatesAfterUpdate(existing, changes);

  // An enrolled training has no end date: clear the stored one, not just any in this request.
  const clearEndDate = changes.isCurrentlyEnrolled === true;
  if (clearEndDate) delete changes.endDate;

  const certificate = certificateStorage ? await createCertificate(existing._id, certificateStorage) : null;
  const removeCertificate = certificateStorage === null;

  let updatedTraining;
  try {
    updatedTraining = await Training.findOneAndUpdate(
      { _id: existing._id },
      {
        $set: {
          ...changes,
          ...(certificate && { certificateId: certificate._id }),
          ...(removeCertificate && { certificateId: null }),
        },
        ...(clearEndDate && { $unset: { endDate: 1 } }),
      },
      { new: true }
    );
  } catch (error) {
    await discardCertificateRecord(certificate);
    throw error;
  }
  if (!updatedTraining) {
    await discardCertificateRecord(certificate);
    throw new NotFoundException("Training not found.");
  }

  // Only once the training points at the new file (or at none) is the old one
  // safe to delete.
  if (certificate || removeCertificate) await deleteCertificate(existing.certificateId);
  return getOne({ query: { _id: String(existing._id) } });
};

export const softRemove = async ({ query }: { query: ITrainingQueryParams }) => {
  const { deleted } = await Training.softDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("Training not found to delete.");
  const result = await getOneSoftDeleted({ query });
  await enqueueProfileCompletion(result?.userId);
  return result;
};

export const hardRemove = async ({ query }: { query: ITrainingQueryParams }) => {
  const training = await getOneSoftDeleted({ query });
  const deletedTraining = await Training.findOneAndDelete(sanitizeQueryIds(query));
  if (!deletedTraining) throw new NotFoundException("Training not found to delete.");
  await deleteCertificate(training.certificateId);
  return training;
};

export const restore = async ({ query }: { query: ITrainingQueryParams }) => {
  const { restored } = await Training.restore(sanitizeQueryIds(query));
  if (!restored) throw new NotFoundException("Training not found in trash.");
  const result = await getOne({ query });
  await enqueueProfileCompletion(result?.userId);
  return result;
};
