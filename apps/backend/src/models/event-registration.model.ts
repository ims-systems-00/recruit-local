import { Schema, model, Document, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";

export interface EventRegistrationInput {
  eventId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  statusId: Schema.Types.ObjectId;
  feedback?: string;
}
export interface IEventRegistrationDoc extends EventRegistrationInput, ISoftDeleteDoc, Document {
  createdAt: Date;
  updatedAt: Date;
}

interface IEventRegistrationModel
  extends Model<IEventRegistrationDoc>,
    ISoftDeleteModel<IEventRegistrationDoc>,
    PaginateModel<IEventRegistrationDoc>,
    AggregatePaginateModel<IEventRegistrationDoc> {}

const eventRegistrationSchema = new Schema<IEventRegistrationDoc>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: modelNames.EVENT,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: modelNames.USER,
      required: true,
    },
    statusId: {
      type: Schema.Types.ObjectId,
      ref: modelNames.STATUS,
      required: true,
    },
    feedback: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

eventRegistrationSchema.plugin(softDeletePlugin);
eventRegistrationSchema.plugin(mongoosePaginate);
eventRegistrationSchema.plugin(aggregatePaginate);

export const EventRegistration = model<IEventRegistrationDoc, IEventRegistrationModel>(
  modelNames.EVENT_REGISTRATION,
  eventRegistrationSchema
);
