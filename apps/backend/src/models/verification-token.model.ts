import { Schema, model, Document, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { automaticReferencePlugin } from "./plugins/automatic-reference.plugin";
import { tenantDataPlugin, TenantInput, ITenantDoc, ITenantModel } from "./plugins/tenant-data.plugin";
import { VERIFICATION_TOKEN_TYPE_ENUMS, modelNames } from "./constants";

export interface VerificationTokenInput extends TenantInput {
  token: string;
  type: VERIFICATION_TOKEN_TYPE_ENUMS;
  email?: string;
  createdBy?: Schema.Types.ObjectId;
}

export interface IVerificationTokenDoc extends VerificationTokenInput, ITenantDoc, Document {
  createdAt: Date;
  updatedAt: Date;
}

interface IVerificationTokenModel<T extends ITenantDoc = IVerificationTokenDoc>
  extends Model<T>,
    PaginateModel<T>,
    ITenantModel<T>,
    AggregatePaginateModel<T> {}

const schema = new Schema<IVerificationTokenDoc>(
  {
    token: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(VERIFICATION_TOKEN_TYPE_ENUMS),
      required: true,
    },
    email: {
      type: String,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: modelNames.USER,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

schema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

// Apply plugins
schema.plugin(mongoosePaginate);
schema.plugin(aggregatePaginate);
schema.plugin(tenantDataPlugin);
// schema.plugin(automaticReferencePlugin({ model: "VerificationToken", referencePrefix: "VRT" }));

export const VerificationToken = model<IVerificationTokenDoc, IVerificationTokenModel>(
  modelNames.VERIFICATION_TOKEN,
  schema
);
