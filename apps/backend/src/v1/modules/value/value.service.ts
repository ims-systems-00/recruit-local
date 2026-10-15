import { PipelineStage } from "mongoose";
import { IListParams, ListQueryParams, ValueAssessmentResponseDto } from "@rl/types";
import { ValueInput, Value, Job } from "../../../models";
import { BadRequestException, ConflictException, NotFoundException } from "../../../common/helper";
import {
  matchQuery,
  excludeDeletedQuery,
  onlyDeletedQuery,
  cursorPageStages,
  toCursorPage,
} from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { valueProjectQuery } from "./value.query";

type IListValueParams = IListParams<ValueInput> & { offset?: number };
type IValueQueryParams = ListQueryParams<ValueInput>;

export const list = async ({ query = {}, options, offset = 0 }: IListValueParams) => {
  const limit = options?.limit && options.limit > 0 ? options.limit : 10;

  const docs = await Value.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...valueProjectQuery(),
    ...cursorPageStages(options?.sort ? String(options.sort) : undefined, offset, limit),
  ]);

  return toCursorPage(docs, limit);
};

export const getOne = async ({ query = {} }: IListValueParams) => {
  const results = await Value.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...valueProjectQuery(),
  ]);
  if (results.length === 0) throw new NotFoundException("Value not found.");
  return results[0];
};

export const listSoftDeleted = async ({ query = {}, options, offset = 0 }: IListValueParams) => {
  const limit = options?.limit && options.limit > 0 ? options.limit : 10;

  const docs = await Value.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...valueProjectQuery(),
    ...cursorPageStages(options?.sort ? String(options.sort) : undefined, offset, limit),
  ]);

  return toCursorPage(docs, limit);
};

export const getOneSoftDeleted = async ({ query = {} }: IListValueParams) => {
  const results = await Value.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...valueProjectQuery(),
  ]);
  if (results.length === 0) throw new NotFoundException("Value not found in trash.");
  return results[0];
};

export const topThree = ({ query = {} }: IListValueParams) => {
  const pipeline: PipelineStage[] = [
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    { $sort: { weight: -1, label: 1 } },
    { $limit: 3 },
    ...valueProjectQuery(),
  ];

  return Value.aggregate(pipeline);
};

/**
 * The self-evaluation questions for one active value.
 *
 * Throws 400 rather than 404 when the value exists but has no questions yet:
 * the value is real, it just cannot be evaluated until content is seeded.
 */
export const getAssessment = async ({ id }: { id: string }): Promise<ValueAssessmentResponseDto> => {
  const value = await Value.findOne({ _id: id, isActive: true, "deleteMarker.status": { $ne: true } })
    .select("type label assessment")
    .lean();
  if (!value) throw new NotFoundException("Value not found.");
  if (!value.assessment?.questions?.length) {
    throw new BadRequestException("This value has no evaluation questions yet.");
  }

  return {
    _id: String(value._id),
    type: value.type,
    label: value.label,
    heading: value.assessment.heading,
    questions: value.assessment.questions.map(({ key, text, placeholder }) => ({ key, text, placeholder })),
  };
};

export const create = async (payload: ValueInput) => {
  const value = new Value(payload);
  return value.save();
};

export const update = async ({ query, payload }: { query: IValueQueryParams; payload: Partial<ValueInput> }) => {
  const updated = await Value.findOneAndUpdate(sanitizeQueryIds(query), { $set: payload }, { new: true });
  if (!updated) throw new NotFoundException("Value not found.");
  return updated;
};

export const softRemove = async ({ query }: { query: IValueQueryParams }) => {
  const { deleted } = await Value.softDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("Value not found to delete.");
  return getOneSoftDeleted({ query });
};

export const hardRemove = async ({ query }: { query: IValueQueryParams }) => {
  const result = await getOneSoftDeleted({ query });

  // Jobs hold their values as bare ids, so deleting a value outright would orphan
  // them. Soft-deleted jobs count too: they can be restored. No race with a job
  // adding it meanwhile — the value is already in the trash, and a job's values
  // must be live entries.
  const jobsUsingValue = await Job.countDocuments({ "values.value": result._id });
  if (jobsUsingValue > 0) {
    throw new ConflictException(
      `This value is used by ${jobsUsingValue} job(s), so it cannot be permanently deleted. Leave it in the trash or deactivate it instead.`
    );
  }

  const deleted = await Value.findOneAndDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("Value not found to delete.");
  return result;
};

export const restore = async ({ query }: { query: IValueQueryParams }) => {
  const { restored } = await Value.restore(sanitizeQueryIds(query));
  if (!restored) throw new NotFoundException("Value not found in trash.");
  return getOne({ query });
};
