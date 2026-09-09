import { NotFoundException } from "../../../common/helper";
import { cursorSortStage, toCursorPage } from "../../../common/query";
import { IListNotificationParams } from "./notification.interface";
import { Notification, NotificationInput } from "../../../models";

const populates = [
  {
    path: "userId",
    select: "fullName email",
  },
];

export const listNotification = async ({ query = {}, options, offset = 0 }: IListNotificationParams) => {
  const limit = options?.limit && options.limit > 0 ? options.limit : 10;
  const sort = options?.sort ? String(options.sort) : "-createdAt";

  // `find` rather than the paginate helper: one extra document is the whole
  // `hasNextPage` answer, so there is no $count branch to run.
  const docs = await Notification.find({ $and: [query, { "deleteMarker.status": { $ne: true } }] })
    .populate(populates)
    .sort(cursorSortStage(sort))
    .skip(offset)
    .limit(limit + 1)
    .lean();

  return toCursorPage(docs, limit);
};

/** How many match, ignoring paging. Only the legacy `?page=` branch needs this. */
export const countNotification = ({ query = {} }: IListNotificationParams) =>
  Notification.countDocuments({ $and: [query, { "deleteMarker.status": { $ne: true } }] });

export const getNotification = async (id: string) => {
  const notification = await Notification.findOneWithExcludeDeleted({ _id: id });
  if (!notification) throw new NotFoundException("Notification not found.");

  return notification.populate(populates);
};

export const updateNotification = async (id: string, payload: Partial<NotificationInput>) => {
  await getNotification(id);
  const updatedNotification = await Notification.findOneAndUpdate(
    { _id: id },
    {
      $set: { ...payload },
    },
    { new: true }
  );

  return updatedNotification.populate(populates);
};

export const createNotification = async (payload: NotificationInput) => {
  let notification = new Notification(payload);
  notification = await notification.save();

  return notification.populate(populates);
};

export const softRemoveNotification = async (id: string) => {
  const notification = await getNotification(id);
  const { deleted } = await Notification.softDelete({ _id: id });

  return { notification, deleted };
};

export const hardRemoveNotification = async (id: string) => {
  const notification = await getNotification(id);
  await Notification.findOneAndDelete({ _id: id });

  return notification;
};

export const restoreNotification = async (id: string) => {
  const { restored } = await Notification.restore({ _id: id });
  if (!restored) throw new NotFoundException("Notification not found in trash.");

  const notification = await getNotification(id);

  return { notification, restored };
};
