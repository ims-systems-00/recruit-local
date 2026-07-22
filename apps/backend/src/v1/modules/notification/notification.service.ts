import { NotFoundException } from "../../../common/helper";
import { IListNotificationParams } from "./notification.interface";
import { Notification, NotificationInput } from "../../../models";

const populates = [
  {
    path: "userId",
    select: "fullName email",
  },
];

export const listNotification = ({ query = {}, options }: IListNotificationParams) => {
  return Notification.paginateAndExcludeDeleted(query, { ...options, populate: populates });
};

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
