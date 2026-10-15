import { IListParams, ListQueryParams } from "@rl/types";
import { SkillCatalogInput, SkillCatalog } from "../../../models";
import { ConflictException, NotFoundException } from "../../../common/helper";
import {
  matchQuery,
  excludeDeletedQuery,
  onlyDeletedQuery,
  cursorPageStages,
  toCursorPage,
} from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { skillCatalogProjectQuery } from "./skill-catalog.query";

type ISkillCatalogListParams = IListParams<SkillCatalogInput> & { offset?: number };
type ISkillCatalogQueryParams = ListQueryParams<SkillCatalogInput>;

/** Mongo's duplicate-key error — here only ever the unique `normalizedName` index. */
const DUPLICATE_KEY = 11000;

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" && error !== null && (error as { code?: number }).code === DUPLICATE_KEY;

/**
 * Create, rename and restore can each collide with a live entry of the same
 * name. That is the caller's mistake, so it surfaces as a 409, not a 500.
 */
const withDuplicateNameAsConflict = async <T>(operation: () => Promise<T>): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new ConflictException("A skill with this name already exists in the catalogue.");
    }
    throw error;
  }
};

export const list = async ({ query = {}, options, offset = 0 }: ISkillCatalogListParams) => {
  const limit = options?.limit && options.limit > 0 ? options.limit : 10;

  const docs = await SkillCatalog.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...skillCatalogProjectQuery(),
    ...cursorPageStages(options?.sort ? String(options.sort) : undefined, offset, limit),
  ]);

  return toCursorPage(docs, limit);
};

export const getOne = async ({ query = {} }: ISkillCatalogListParams) => {
  const results = await SkillCatalog.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...skillCatalogProjectQuery(),
  ]);
  if (results.length === 0) throw new NotFoundException("Skill not found.");
  return results[0];
};

export const listSoftDeleted = async ({ query = {}, options, offset = 0 }: ISkillCatalogListParams) => {
  const limit = options?.limit && options.limit > 0 ? options.limit : 10;

  const docs = await SkillCatalog.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...skillCatalogProjectQuery(),
    ...cursorPageStages(options?.sort ? String(options.sort) : undefined, offset, limit),
  ]);

  return toCursorPage(docs, limit);
};

export const getOneSoftDeleted = async ({ query = {} }: ISkillCatalogListParams) => {
  const results = await SkillCatalog.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...skillCatalogProjectQuery(),
  ]);
  if (results.length === 0) throw new NotFoundException("Skill not found in trash.");
  return results[0];
};

/**
 * The live, active entries among `ids` — what a job's `skills` are checked
 * against. An id missing from the result is unknown, deleted, or deactivated.
 */
export const findActiveByIds = (ids: string[]) =>
  SkillCatalog.find({ _id: { $in: ids }, isActive: true, "deleteMarker.status": { $ne: true } })
    .select("_id name")
    .lean();

export const create = (payload: SkillCatalogInput) =>
  withDuplicateNameAsConflict(() => new SkillCatalog(payload).save());

export const update = async ({
  query,
  payload,
}: {
  query: ISkillCatalogQueryParams;
  payload: Partial<SkillCatalogInput>;
}) => {
  const updated = await withDuplicateNameAsConflict(() =>
    SkillCatalog.findOneAndUpdate(sanitizeQueryIds(query), { $set: payload }, { new: true })
  );
  if (!updated) throw new NotFoundException("Skill not found.");
  return updated;
};

export const softRemove = async ({ query }: { query: ISkillCatalogQueryParams }) => {
  const { deleted } = await SkillCatalog.softDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("Skill not found to delete.");
  return getOneSoftDeleted({ query });
};

export const hardRemove = async ({ query }: { query: ISkillCatalogQueryParams }) => {
  const result = await getOneSoftDeleted({ query });
  const deleted = await SkillCatalog.findOneAndDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("Skill not found to delete.");
  return result;
};

export const restore = async ({ query }: { query: ISkillCatalogQueryParams }) => {
  const { restored } = await withDuplicateNameAsConflict(() => SkillCatalog.restore(sanitizeQueryIds(query)));
  if (!restored) throw new NotFoundException("Skill not found in trash.");
  return getOne({ query });
};
