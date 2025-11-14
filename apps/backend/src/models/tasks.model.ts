import { Schema, model, Document, Model, Types } from "mongoose";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { TASK_STATUS_ENUMS, TASK_PRIORITY_ENUMS } from "@inrm/types";
import { modelNames } from "./constants";
import { User } from "./user.model";
import { tenantDataPlugin, ITenantDoc } from "./plugins/tenant-data.plugin";
import { Tenant } from "./tenant.model";

export interface TaskInput {
  title: string;
  description?: string;
  dueDate?: Date;
  status?: TASK_STATUS_ENUMS;
  statusChangedAt?: Date;
  duplicatedTask?: Types.ObjectId[];
  relatedTask?: Types.ObjectId[];
  assignedTo?: Types.ObjectId[];
  relatedAudit?: Types.ObjectId[];
  relatedOrganisation?: Types.ObjectId[];
  relatedQuotation?: Types.ObjectId[];
  priority?: TASK_PRIORITY_ENUMS;
  createdBy?: Types.ObjectId;
  auditId?: Types.ObjectId;
  category?: Types.ObjectId;
}

export interface ITaskDoc extends TaskInput, ISoftDeleteDoc, ITenantDoc, Document {
  createdAt?: Date;
  updatedAt?: Date;
}

interface ITaskModel extends Model<ITaskDoc>, ISoftDeleteModel<ITaskDoc> {}

const schema = new Schema<ITaskDoc>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: Object.values(TASK_STATUS_ENUMS),
      default: TASK_STATUS_ENUMS.PENDING,
    },
    statusChangedAt: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    duplicatedTask: [
      {
        type: Schema.Types.ObjectId,
        ref: modelNames.TASK,
        default: null,
      },
    ],
    relatedTask: [
      {
        type: Schema.Types.ObjectId,
        ref: modelNames.TASK,
        default: null,
      },
    ],
    assignedTo: [
      {
        type: Schema.Types.ObjectId,
        ref: User.modelName,
        default: null,
      },
    ],

    relatedOrganisation: [
      {
        type: Schema.Types.ObjectId,
        ref: Tenant.modelName,
        default: null,
      },
    ],

    priority: {
      type: String,
      enum: Object.values(TASK_PRIORITY_ENUMS),
      default: TASK_PRIORITY_ENUMS.LOW,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: User.modelName,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Apply plugins
schema.plugin(softDeletePlugin);
schema.plugin(tenantDataPlugin);

const Task = model<ITaskDoc, ITaskModel>(modelNames.TASK, schema);
export { Task };
