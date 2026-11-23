import { Schema, model, Document, Model } from "mongoose";
import { User } from "./user.model";
import { modelNames } from "./constants";

export interface SessionInput {
  userId: Schema.Types.ObjectId | string;
  accessHash: string;
  refreshHash: string;
  expiresAt: Date;
}

export interface ISessionDoc extends SessionInput, Document {}

interface ISessionModel extends Model<ISessionDoc> {}

const sessionSchema = new Schema<ISessionDoc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: User.modelName,
      required: true,
      index: true,
    },
    accessHash: {
      type: String,
      required: true,
      unique: true,
    },
    refreshHash: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// mongo deletes the session once the refresh token has expired
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session = model<ISessionDoc, ISessionModel>(modelNames.SESSION, sessionSchema);

export { Session };
