import { CustomHelpers, Schema } from "joi";
import mongoose from "mongoose";

export function validate(schema: Schema, data: any) {
  const options = { abortEarly: false };
  const { error } = schema.validate(data, options);
  if (!error) return null;

  const errors: { [key: string]: string } = {};
  for (let item of error.details) {
    errors[item.path[0]] = item.message;
  }

  return errors;
}

export const objectIdValidation = (value: string, helpers: CustomHelpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message({ custom: `"${helpers.state.path.join(".")}" must be a valid ObjectId` });
  }
  return value;
};
