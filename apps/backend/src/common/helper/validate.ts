import { Schema } from "joi";

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
