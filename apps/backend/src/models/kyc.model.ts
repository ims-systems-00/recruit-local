import { Schema, model, Document, Model, PaginateModel, AggregatePaginateModel, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { KYC_STATUS, KYC_DOCUMENT_TYPE } from "@rl/types";
import { modelNames } from "./constants";

export interface IKycInput {
  userId: Types.ObjectId;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  documentType: KYC_DOCUMENT_TYPE;
  documentFrontId: Types.ObjectId;
  documentBackId?: Types.ObjectId;
}

export interface IKycDoc extends IKycInput, ISoftDeleteDoc, Document {
  status: KYC_STATUS;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IKycModel
  extends Model<IKycDoc>,
    ISoftDeleteModel<IKycDoc>,
    PaginateModel<IKycDoc>,
    AggregatePaginateModel<IKycDoc> {}

const kycSchema = new Schema<IKycDoc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: modelNames.USER,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(KYC_STATUS),
      default: KYC_STATUS.PENDING,
    },
    documentType: {
      type: String,
      enum: Object.values(KYC_DOCUMENT_TYPE),
      required: true,
    },
    documentFrontId: {
      type: Schema.Types.ObjectId,
      ref: modelNames.FILE_MEDIA,
      required: true,
    },
    documentBackId: {
      type: Schema.Types.ObjectId,
      ref: modelNames.FILE_MEDIA,
    },
    rejectionReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

kycSchema.plugin(softDeletePlugin);
kycSchema.plugin(mongoosePaginate);
kycSchema.plugin(aggregatePaginate);

export const Kyc = model<IKycDoc, IKycModel>("Kyc", kycSchema);
