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
import { Training, TrainingInput } from "../../../models";
import { modelNames } from "../../../models/constants";
import { AwsStorageTemplate } from "../../../models/templates/aws-storage.template";
import * as FileMediaService from "../file-media/file-media.service";
import * as skillCatalogService from "../skill-catalog/skill-catalog.service";
import { enqueueProfileCompletion } from "../../../queue/profileCompletionUpdateQueue";
import { populateTrainingCertificateQuery, populateTrainingSkillsQuery, trainingProjectQuery } from "./training.query";

type IListTrainingParams = IListParams<TrainingInput> & { offset?: number };
type ITrainingQueryParams = ListQueryParams<TrainingInput>;

// `certificateStorage` is the uploaded file's S3 location; it becomes a FileMedia
// and only its id is stored on the training.
type WithCertificate<T> = T & { certificateStorage?: AwsStorageTemplate };

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

const createCertificate = (trainingId: Types.ObjectId, storage: AwsStorageTemplate) =>
  FileMediaService.create({
    payload: {
      collectionName: modelNames.TRAINING,
      collectionDocument: trainingId,
      storageInformation: storage,
      visibility: VISIBILITY_ENUM.PUBLIC,
    },
  });

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
  await training.save();

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

  // An enrolled training has no end date: clear the stored one, not just any in this request.
  const clearEndDate = changes.isCurrentlyEnrolled === true;
  if (clearEndDate) delete changes.endDate;

  const certificate = certificateStorage ? await createCertificate(existing._id, certificateStorage) : null;

  const updatedTraining = await Training.findOneAndUpdate(
    { _id: existing._id },
    {
      $set: { ...changes, ...(certificate && { certificateId: certificate._id }) },
      ...(clearEndDate && { $unset: { endDate: 1 } }),
    },
    { new: true }
  );
  if (!updatedTraining) throw new NotFoundException("Training not found.");

  // Only once the training points at the new file is the old one safe to delete.
  if (certificate) await deleteCertificate(existing.certificateId);
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
