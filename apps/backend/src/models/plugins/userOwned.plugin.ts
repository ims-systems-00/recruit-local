import { Schema } from "mongoose";
import { modelNames } from "../constants";

export interface IUserOwnedInput {
  userId: Schema.Types.ObjectId;
}

export const userOwnedPlugin = (schema: Schema) => {
  if (!(schema instanceof Schema)) throw new Error("The schema must be an instance of mongoose schema");

  schema.add({
    userId: {
      type: Schema.Types.ObjectId,
      ref: modelNames.USER,
      required: true,
      index: true,
    },
  });
};
