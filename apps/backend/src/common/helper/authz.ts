/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyAbility } from "@casl/ability";
import { permittedFieldsOf } from "@casl/ability/extra";
import { pick } from "lodash";
import { ForbiddenException } from "./errors/api-error";

/**
 * Helper to flatten a nested object into dot-notation keys.
 * Example: { a: { b: 1 } } -> ["a.b"]
 */
const getFlattenedKeys = (obj: Record<string, any>, prefix = ""): string[] => {
  return Object.keys(obj).reduce((acc: string[], key: string) => {
    const pre = prefix.length ? prefix + "." : "";
    if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
      acc.push(...getFlattenedKeys(obj[key], pre + key));
    } else {
      acc.push(pre + key);
    }
    return acc;
  }, []);
};

/**
 * Sanitizes a list of documents based on CASL field-level permissions.
 */
export const sanitizeDocuments = <T>(
  docs: any[],
  ability: AnyAbility,
  action: string,
  EntityClass: new (data: any) => any,
  options: any
): T[] => {
  return docs.map((doc) => {
    const plainDoc = doc.toObject ? doc.toObject() : doc;

    const authZEntity = new EntityClass(plainDoc);

    const allowedFields = permittedFieldsOf(ability, action, authZEntity, options);

    // Use 'as T' to tell TypeScript that the result of pick matches our expected type.
    // If no fields are allowed, we return an empty object cast to T.
    return (allowedFields.length > 0 ? pick(plainDoc, allowedFields) : {}) as T;
  });
};

export const sanitizeDocument = <T>(
  doc: any,
  ability: AnyAbility,
  action: string,
  EntityClass: new (data: any) => any,
  options: any
): T => {
  if (!doc) return null as any;
  const plainDoc = doc.toObject ? doc.toObject() : doc;
  const authZEntity = new EntityClass(plainDoc);
  const allowedFields = permittedFieldsOf(ability, action, authZEntity, options);
  return (allowedFields.length > 0 ? pick(plainDoc, allowedFields) : {}) as T;
};

/**
 * Validates that the payload only contains fields the user is allowed to update.
 * Throws a ForbiddenException if any unauthorized fields are present.
 */
export const validateUpdatePayload = (
  payload: Record<string, any>,
  ability: AnyAbility,
  action: string,
  authZEntity: any
): void => {
  if (!payload || Object.keys(payload).length === 0) return;

  // Use flattened keys to prevent nested object injection attacks
  const fields = getFlattenedKeys(payload);

  // Find fields that the user CANNOT update
  const invalidFields = fields.filter((field) => !ability.can(action, authZEntity, field));

  if (invalidFields.length > 0) {
    throw new ForbiddenException(`You are not authorized to update the following fields: ${invalidFields.join(", ")}`);
  }
};
