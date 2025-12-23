import { Schema, model, Document, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { userOwnedPlugin, IUserOwned } from "./plugins/userOwned.plugin";
import { AwsStorageTemplate, awsStorageTemplateMongooseDefinition } from "./templates/aws-storage.template";

export interface CertificationInput extends IUserOwned {
  title: string;
  issuingOrganization: string;
  issueDate: Date;
}

export interface ICertificationDoc extends CertificationInput, ISoftDeleteDoc, Document {
  id: string;
  imageSrc?: string;
  imageStorage?: AwsStorageTemplate;
  createdAt: Date;
  updatedAt: Date;
}

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
    imageSrc: { type: String, required: false },
    imageStorage: { type: Schema.Types.Mixed, default: awsStorageTemplateMongooseDefinition },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: false,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

certificationSchema.plugin(softDeletePlugin);
certificationSchema.plugin(mongoosePaginate);
certificationSchema.plugin(aggregatePaginate);
certificationSchema.plugin(userOwnedPlugin);

export const Certification = model<ICertificationDoc, ICertificationModel>(
  modelNames.CERTIFICATION,
  certificationSchema
);
