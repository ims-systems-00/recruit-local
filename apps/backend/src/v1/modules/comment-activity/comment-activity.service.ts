import { NotFoundException } from "../../../common/helper";
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

export const listCommentActivity = ({ query = {}, options }: IListCommentActivityParams) => {
  return CommentActivity.paginateAndExcludeDeleted(query, { ...options, sort: { createdAt: -1 }, populate: populates });
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
