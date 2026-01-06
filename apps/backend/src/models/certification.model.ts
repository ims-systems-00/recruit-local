import { Schema, model, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { userOwnedPlugin, IUserOwnedInput } from "./plugins/userOwned.plugin";
import { jobProfilePlugin, JobProfileInput } from "./plugins/jobProfile.plugin";
import { AwsStorageTemplate, awsStorageTemplateMongooseDefinition } from "./templates/aws-storage.template";
import { baseSchemaOptions } from "./options/schema.options";
import { IBaseDoc } from "./interfaces/base.interface";

export interface CertificationInput extends IUserOwnedInput, JobProfileInput {
  title: string;
  issuingOrganization: string;
  issueDate: Date;
  imageSrc?: string;
  imageStorage?: AwsStorageTemplate;

  // todo: certification document storage (pdf, link, etc.), verification link
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
    imageSrc: { type: String, required: false },
    imageStorage: { type: Schema.Types.Mixed, default: awsStorageTemplateMongooseDefinition },
  },
  {
    ...baseSchemaOptions,
  }
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
