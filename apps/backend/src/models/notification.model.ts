import { Schema, model, Document, Model } from "mongoose";
import { User } from "./user.model";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { NOTIFICATION_STATUS_ENUMS, modelNames } from "./constants";

export interface NotificationInput {
  title: string;
  value: string;
  userId?: Schema.Types.ObjectId;
  status?: NOTIFICATION_STATUS_ENUMS;
}

interface INotificationDoc extends NotificationInput, ISoftDeleteDoc, Document {
  deliveredAt?: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface INotificationModel extends Model<INotificationDoc>, ISoftDeleteModel<INotificationDoc> {}

// Create the notification schema
const notificationSchema = new Schema<INotificationDoc>(
  {
    title: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: User.modelName,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(NOTIFICATION_STATUS_ENUMS),
      default: NOTIFICATION_STATUS_ENUMS.DELIVERED,
    },
    deliveredAt: {
      type: Date,
      default: Date.now,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Apply plugins
notificationSchema.plugin(softDeletePlugin);

// Create and export the model
const Notification = model<INotificationDoc, INotificationModel>(modelNames.NOTIFICATION, notificationSchema);
export { Notification };
