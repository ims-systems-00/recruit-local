import { Schema, model, Model, PaginateModel, AggregatePaginateModel, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { userOwnedPlugin, IUserOwnedInput } from "./plugins/userOwned.plugin";
import { jobProfilePlugin, JobProfileInput } from "./plugins/jobProfile.plugin";
import { IBaseDoc } from "./interfaces/base.interface";

export interface CertificationInput extends IUserOwnedInput, JobProfileInput {
  title: string;
  issuingOrganization: string;
  issueDate: Date;
  imageId?: Types.ObjectId;
}

export interface ICertificationDoc extends CertificationInput, IBaseDoc, ISoftDeleteDoc {}

interface ICertificationModel
  extends Model<ICertificationDoc>,
    ISoftDeleteModel<ICertificationDoc>,
    PaginateModel<ICertificationDoc>,
    AggregatePaginateModel<ICertificationDoc> {}

const certificationSchema = new Schema<ICertificationDoc>(
  {
    title: { type: String, required: true },
    issuingOrganization: { type: String, required: true },
    issueDate: { type: Date, required: true },
    imageId: {
      type: Schema.Types.ObjectId,
      ref: modelNames.FILE_MEDIA,
      default: null,
    },
  },
  {}
);

certificationSchema.plugin(softDeletePlugin);
certificationSchema.plugin(mongoosePaginate);
certificationSchema.plugin(aggregatePaginate);
certificationSchema.plugin(userOwnedPlugin);
certificationSchema.plugin(jobProfilePlugin);

export const Certification = model<ICertificationDoc, ICertificationModel>(
  modelNames.CERTIFICATION,
  certificationSchema
);
