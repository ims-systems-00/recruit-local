import { Schema, model, Document, Model, UpdateQuery, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { getGeoLocationFromAddress } from "../common/helper";
import { automaticReferencePlugin } from "./plugins/automatic-reference.plugin";
import { userOwnedPlugin, IUserOwnedInput } from "./plugins/userOwned.plugin";

export interface LocationInput extends IUserOwnedInput {
  locationRef?: string;
  addressInMap?: string;
  addressBuilding?: string;
  addressStreet?: string;
  addressStreet2?: string;
  addressStreet3?: string;
  addressCity?: string;
  addressPostCode?: string;
  addressStateProvince?: string;
  addressCountry?: string;
  lat: number;
  lng: number;
}

export interface ILocationDoc extends LocationInput, ISoftDeleteDoc, Document {
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ILocationModel
  extends Model<ILocationDoc>,
    ISoftDeleteModel<ILocationDoc>,
    PaginateModel<ILocationDoc>,
    AggregatePaginateModel<ILocationDoc> {}

const locationSchema = new Schema<ILocationDoc>(
  {
    locationRef: {
      type: String,
      required: true,
    },
    addressInMap: {
      type: String,
    },
    addressBuilding: {
      type: String,
    },
    addressStreet: {
      type: String,
    },
    addressCity: {
      type: String,
    },
    addressPostCode: {
      type: String,
    },
    addressStateProvince: {
      type: String,
    },
    addressCountry: {
      type: String,
    },
    lat: {
      type: Number,
    },
    lng: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

locationSchema.plugin(userOwnedPlugin);
locationSchema.plugin(softDeletePlugin);
locationSchema.plugin(automaticReferencePlugin({ model: modelNames.LOCATION, referencePrefix: "LOC" }));
locationSchema.plugin(mongoosePaginate);
locationSchema.plugin(aggregatePaginate);

locationSchema.pre("validate", async function (next) {
  if (this.addressInMap) {
    const results = await getGeoLocationFromAddress(this.addressInMap);
    this.lat = results[0]?.latitude || 0;
    this.lng = results[0]?.longitude || 0;
  }
  next();
});

locationSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();

  if (!update || Array.isArray(update)) {
    return next();
  }
  const typedUpdate = update as UpdateQuery<ILocationDoc>;

  const addressInMap = typedUpdate?.$set?.addressInMap || typedUpdate?.addressInMap;

  if (addressInMap) {
    console.log("Updating geocode based on new address");
    const results = await getGeoLocationFromAddress(addressInMap as string);
    const lat = results[0]?.latitude || 0;
    const lng = results[0]?.longitude || 0;

    if (!typedUpdate.$set) {
      typedUpdate.$set = {};
    }

    typedUpdate.$set.lat = lat;
    typedUpdate.$set.lng = lng;

    this.setUpdate(typedUpdate);
  }

  next();
});

export const Location = model<ILocationDoc, ILocationModel>(modelNames.LOCATION, locationSchema);
