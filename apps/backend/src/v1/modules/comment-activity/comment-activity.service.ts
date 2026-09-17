import { NotFoundException } from "../../../common/helper";
import { cursorSortStage, toCursorPage } from "../../../common/query";
import { IListCommentActivityParams } from "./comment-activity.interface";
import { CommentActivity, CommentActivityInput } from "../../../models";

const populates = [
  {
    path: "tenantId",
    select: "name industry size phone officeEmail",
  },
  {
    path: "createdBy",
    select: "fullName email profileImageSrc",
  },
  { path: "collectionDocument" },
];

export const listCommentActivity = async ({ query = {}, options, offset = 0 }: IListCommentActivityParams) => {
  const limit = options?.limit && options.limit > 0 ? options.limit : 10;
  const sort = options?.sort ? String(options.sort) : "-createdAt";

  // `find` rather than the paginate helper: one extra document is the whole
  // `hasNextPage` answer, so there is no $count branch to run.
  const docs = await CommentActivity.find({ $and: [query, { "deleteMarker.status": { $ne: true } }] })
    .populate(populates)
    .sort(cursorSortStage(sort))
    .skip(offset)
    .limit(limit + 1)
    .lean();

  return toCursorPage(docs, limit);
};

export const getCommentActivity = async (id: string) => {
  const commentActivity = await CommentActivity.findOneWithExcludeDeleted({ _id: id });
  if (!commentActivity) throw new NotFoundException("Comment and activity not found.");

  return commentActivity.populate(populates);
};

export const updateCommentActivity = async (id: string, payload: Partial<CommentActivityInput>) => {
  await getCommentActivity(id);
  const updatedCommentActivity = await CommentActivity.findOneAndUpdate(
    { _id: id },
    {
      $set: { ...payload },
    },
    { new: true }
  );

  return updatedCommentActivity.populate(populates);
};

export const createCommentActivity = async (payload: CommentActivityInput) => {
  let commentActivity = new CommentActivity(payload);
  commentActivity = await commentActivity.save();

  return commentActivity.populate(populates);
};

export const softRemoveCommentActivity = async (id: string) => {
  const commentActivity = await getCommentActivity(id);
  const { deleted } = await CommentActivity.softDelete({ _id: id });

  return { commentActivity, deleted };
};

export const hardRemoveCommentActivity = async (id: string) => {
  const commentActivity = await getCommentActivity(id);
  await CommentActivity.findOneAndDelete({ _id: id });

  return commentActivity;
};

export const restoreCommentActivity = async (id: string) => {
  const { restored } = await CommentActivity.restore({ _id: id });
  if (!restored) throw new NotFoundException("Comment and activity not found in trash.");

  const commentActivity = await getCommentActivity(id);

  return { commentActivity, restored };
};
