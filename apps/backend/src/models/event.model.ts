import { Schema, model, Document, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { AwsStorageTemplate, awsStorageTemplateMongooseDefinition } from "./templates/aws-storage.template";
import { modelNames } from "./constants";
import { EVENT_STATUS_ENUMS, EVENT_MODE_ENUMS, EVENT_TYPE_ENUMS, VirtualEvent } from "@rl/types";

export interface EventInput {
  organizers: [
    {
      type: Schema.Types.ObjectId;
    },
  ];
  title: string;
  type: EVENT_TYPE_ENUMS;
  description: string;
  location: string;
  capacity: number;
  startDate: Date;
  startTime: string;
  endDate: Date;
  endTime: string;
  bannerImageSrc?: string;
  bannerImageStorage?: AwsStorageTemplate;
  registrationEndDate: Date;
  status: EVENT_STATUS_ENUMS;
  mode: EVENT_MODE_ENUMS;
  virtualEvent?: VirtualEvent;
}

export interface IEventDoc extends EventInput, ISoftDeleteDoc, Document {
  createdAt: Date;
  updatedAt: Date;
}

interface IEventModel
  extends Model<IEventDoc>,
    ISoftDeleteModel<IEventDoc>,
    PaginateModel<IEventDoc>,
    AggregatePaginateModel<IEventDoc> {}

const eventSchema = new Schema<IEventDoc>(
  {
    organizers: [
      {
        type: Schema.Types.ObjectId,
        ref: modelNames.TENANT,
        required: true,
      },
    ],
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(EVENT_TYPE_ENUMS),
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    bannerImageSrc: {
      type: String,
    },
    bannerImageStorage: {
      type: Schema.Types.Mixed,
      default: awsStorageTemplateMongooseDefinition,
    },
    registrationEndDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(EVENT_STATUS_ENUMS),
      required: true,
    },
    mode: {
      type: String,
      enum: Object.values(EVENT_MODE_ENUMS),
      required: true,
    },
    virtualEvent: {
      link: {
        type: String,
        required: function (this: IEventDoc) {
          return this.mode === EVENT_MODE_ENUMS.VIRTUAL || this.mode === EVENT_MODE_ENUMS.HYBRID;
        },
      },
      id: {
        type: String,
      },
      password: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

eventSchema.plugin(softDeletePlugin);
eventSchema.plugin(mongoosePaginate);
eventSchema.plugin(aggregatePaginate);

export const Event = model<IEventDoc, IEventModel>(modelNames.EVENT, eventSchema);
