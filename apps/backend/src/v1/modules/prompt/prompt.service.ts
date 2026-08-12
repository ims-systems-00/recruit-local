import { ClientSession } from "mongoose";
import { PROMPT_LABEL } from "@rl/types";
import { IPromptDoc, Prompt } from "../../../models";
import { BadRequestException, ConflictException, NotFoundException } from "../../../common/helper";
import { withTransaction } from "../../../common/helper/database-transaction";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { promptProjectionQuery, promptNameSummaryQuery } from "./prompt.query";
import { invalidatePromptCache } from "./prompt.cache";
import { extractPromptVariables } from "./prompt.render";
import {
  IPromptListParams,
  IPromptGetParams,
  IPromptCreateParams,
  IPromptUpdateParams,
  IPromptSetLabelParams,
  IPromptRemoveLabelParams,
  IPromptResolveParams,
} from "./prompt.interface";

/** Mongo's duplicate-key error, raised by either of the two unique indexes. */
const DUPLICATE_KEY = 11000;

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" && error !== null && (error as { code?: number }).code === DUPLICATE_KEY;

/**
 * Runs `operation` in the caller's transaction when there is one, and opens its
 * own otherwise. Every multi-document write here needs a transaction; not every
 * caller has one to lend.
 */
const inTransaction = <T>(session: ClientSession | undefined, operation: (session: ClientSession) => Promise<T>) =>
  session ? operation(session) : withTransaction(operation);

const getMongoSession = (session?: ClientSession) => session ?? null;

export const list = ({ query = {}, options, session }: IPromptListParams) => {
  const aggregate = Prompt.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...promptProjectionQuery(),
  ]);

  if (session) aggregate.session(session);

  return Prompt.aggregatePaginate(aggregate, options);
};

export const getOne = async ({ query = {}, session }: IPromptGetParams) => {
  const aggregate = Prompt.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...promptProjectionQuery(),
  ]);

  if (session) aggregate.session(session);

  const prompts = await aggregate;
  if (prompts.length === 0) throw new NotFoundException("Prompt not found.");
  return prompts[0];
};

export const listSoftDeleted = ({ query = {}, options, session }: IPromptListParams) => {
  const aggregate = Prompt.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...promptProjectionQuery(),
  ]);

  if (session) aggregate.session(session);

  return Prompt.aggregatePaginate(aggregate, options);
};

export const getOneSoftDeleted = async ({ query = {}, session }: IPromptGetParams) => {
  const aggregate = Prompt.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...promptProjectionQuery(),
  ]);

  if (session) aggregate.session(session);

  const prompts = await aggregate;
  if (prompts.length === 0) throw new NotFoundException("Prompt not found in trash.");
  return prompts[0];
};

/** The registry view — one row per prompt name rather than per version. */
export const listNames = () => Prompt.aggregate(promptNameSummaryQuery());

const appendVersion = async ({ payload }: IPromptCreateParams, session: ClientSession) => {
  // Soft-deleted versions are counted deliberately: their rows still exist, so
  // reusing a retired version number would collide on the unique index.
  const current = await Prompt.findOne({ name: payload.name }).sort({ version: -1 }).select("version").session(session);
  const version = (current?.version ?? 0) + 1;

  // `latest` follows the newest version, so it has to come off the previous
  // holder first — the unique {name, labels} index rejects the insert otherwise.
  await Prompt.updateOne(
    { name: payload.name, labels: PROMPT_LABEL.LATEST },
    { $pull: { labels: PROMPT_LABEL.LATEST } },
    { session }
  );

  const [created] = await Prompt.create(
    [
      {
        ...payload,
        version,
        labels: [PROMPT_LABEL.LATEST],
        // Derived rather than declared, so the variable list can never drift
        // from the text that actually references them.
        variables: extractPromptVariables(payload.content),
      },
    ],
    { session }
  );
  return created;
};

/**
 * Appends the next version of a prompt. This is the only way content enters the
 * store — existing versions are never rewritten, which is what makes rollback a
 * label move rather than an edit.
 *
 * Version allocation is read-then-write, so two concurrent creates can pick the
 * same number. The unique index turns that into a duplicate-key error rather
 * than a silent second v4, and the loser simply retries with a fresh read.
 */
export const create = async (params: IPromptCreateParams): Promise<IPromptDoc> => {
  const MAX_ATTEMPTS = 3;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const created = await inTransaction(params.session, (session) => appendVersion(params, session));
      invalidatePromptCache(params.payload.name);
      return created;
    } catch (error) {
      if (!isDuplicateKeyError(error) || attempt === MAX_ATTEMPTS) throw error;
    }
  }

  // Unreachable: the loop either returns or rethrows on its final attempt.
  throw new ConflictException("Could not allocate a prompt version; please retry.");
};

/**
 * Metadata only. `content`, `name` and `version` are immutable — changing what
 * a prompt says is `create`, not `update`.
 */
export const update = async ({ query, payload, session }: IPromptUpdateParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);

  const updated = await Prompt.findOneAndUpdate(
    { ...sanitizedQuery, "deleteMarker.status": { $ne: true } },
    { $set: { ...payload } },
    { new: true, session: getMongoSession(session) }
  );

  if (!updated) throw new NotFoundException("Prompt not found.");

  invalidatePromptCache(updated.name);
  return getOne({ query: { _id: updated._id!.toString() }, session });
};

/**
 * Moves a label onto a version — this is both "publish" and "roll back",
 * depending on which direction you point it.
 *
 * The pull must precede the add: the unique {name, labels} index means a label
 * cannot briefly exist on two versions, so adding first would fail.
 */
export const setLabel = async ({ name, label, version, session }: IPromptSetLabelParams) => {
  if (label === PROMPT_LABEL.LATEST) {
    throw new BadRequestException("The `latest` label follows the newest version automatically and cannot be moved.");
  }

  const result = await inTransaction(session, async (mongoSession) => {
    const target = await Prompt.findOne({ name, version, "deleteMarker.status": { $ne: true } }).session(mongoSession);
    if (!target) throw new NotFoundException(`Prompt "${name}" version ${version} not found.`);

    await Prompt.updateOne({ name, labels: label }, { $pull: { labels: label } }, { session: mongoSession });
    await Prompt.updateOne({ _id: target._id }, { $addToSet: { labels: label } }, { session: mongoSession });

    return target._id!.toString();
  });

  invalidatePromptCache(name);
  return getOne({ query: { _id: result } });
};

export const removeLabel = async ({ name, label, session }: IPromptRemoveLabelParams) => {
  if (label === PROMPT_LABEL.LATEST) {
    throw new BadRequestException("The `latest` label is managed automatically and cannot be removed.");
  }

  const result = await Prompt.updateOne(
    { name, labels: label },
    { $pull: { labels: label } },
    { session: getMongoSession(session) }
  );

  if (!result.matchedCount) throw new NotFoundException(`No version of "${name}" carries the label "${label}".`);

  invalidatePromptCache(name);
  return { removed: true };
};

/**
 * The runtime's read, and the reason this function exists separately from
 * `getOne`: it takes no ability and applies no CASL scoping, because the agent
 * runs under a candidate or employer session that has no prompt permissions.
 *
 * Cascades through the labels rather than failing on the first miss, so a
 * prompt that has been created but not yet promoted to `production` still
 * resolves to something sensible.
 */
export const findForResolution = async ({ name, label }: IPromptResolveParams) => {
  const candidates = [...new Set([label, PROMPT_LABEL.PRODUCTION, PROMPT_LABEL.LATEST].filter(Boolean))] as string[];

  for (const candidate of candidates) {
    const found = await Prompt.findOne({
      name,
      labels: candidate,
      "deleteMarker.status": { $ne: true },
    }).lean();

    if (found) return { prompt: found, label: candidate };
  }

  return null;
};

export const softDelete = async ({ query, session }: IPromptGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const existing = await getOne({ query: sanitizedQuery, session });

  const { deleted } = await Prompt.softDelete(sanitizedQuery, { session: getMongoSession(session) });
  if (!deleted) throw new NotFoundException("Prompt not found to delete.");

  // Labels are left attached. A soft-deleted version is excluded from
  // resolution anyway, and keeping them means a restore puts the prompt back
  // exactly as it was.
  invalidatePromptCache(existing.name);
  return { deleted };
};

export const hardDelete = async ({ query, session }: IPromptGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const prompt = await getOneSoftDeleted({ query: sanitizedQuery, session });

  const deletedPrompt = await Prompt.findOneAndDelete({ _id: prompt._id }, { session: getMongoSession(session) });
  if (!deletedPrompt) throw new NotFoundException("Prompt not found to delete.");

  invalidatePromptCache(prompt.name);
  return deletedPrompt;
};

export const restore = async ({ query, session }: IPromptGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const existing = await getOneSoftDeleted({ query: sanitizedQuery, session });

  const { restored } = await Prompt.restore(sanitizedQuery, { session: getMongoSession(session) });
  if (!restored) throw new NotFoundException("Prompt not found in trash.");

  invalidatePromptCache(existing.name);
  return { restored };
};
