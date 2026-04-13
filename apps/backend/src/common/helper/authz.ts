/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyAbility } from "@casl/ability";
import { permittedFieldsOf } from "@casl/ability/extra";
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
 * Builds a nested permission tree from flat dot-notation paths.
 * e.g., ["title", "queries.question"] -> { title: true, queries: { question: true } }
 * If a parent has full access ("queries"), it ignores child paths.
 */
const buildPermTree = (paths: string[]) => {
  const tree: any = {};

  // Sort by length so parent paths (e.g., 'a') process before children ('a.b')
  paths
    .sort((a, b) => a.length - b.length)
    .forEach((path) => {
      const keys = path.split(".");
      let current = tree;

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const isLast = i === keys.length - 1;

        // If the parent is already true, we have full access. Stop processing this path.
        if (current[key] === true) break;

        if (isLast) {
          current[key] = true;
        } else {
          current[key] = current[key] || {};
          current = current[key];
        }
      }
    });
  return tree;
};

/**
 * A CASL-aware picker that natively understands array traversal.
 * Replaces lodash.pick which fails on arrays of objects.
 */
const deepPick = (source: any, allowedPaths: string[]): any => {
  if (!allowedPaths.length) return {};

  const permTree = buildPermTree(allowedPaths);

  const traverseAndPick = (obj: any, treeNode: any): any => {
    // Base Case 1: Full permission for this node
    if (treeNode === true) return obj;

    // Base Case 2: Array Traversal
    if (Array.isArray(obj)) {
      return obj.map((item) => traverseAndPick(item, treeNode)).filter((i) => i !== undefined);
    }

    // Base Case 3: Object Traversal
    if (typeof obj === "object" && obj !== null && typeof treeNode === "object") {
      const result: any = {};
      for (const key of Object.keys(treeNode)) {
        if (obj[key] !== undefined) {
          result[key] = traverseAndPick(obj[key], treeNode[key]);
        }
      }
      return result;
    }

    return undefined; // No permission
  };

  return traverseAndPick(source, permTree);
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

    return (allowedFields.length > 0 ? deepPick(plainDoc, allowedFields) : {}) as T;
  });
};

/**
 * Sanitizes a single document based on CASL field-level permissions.
 */
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

  return (allowedFields.length > 0 ? deepPick(plainDoc, allowedFields) : {}) as T;
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

  const fields = getFlattenedKeys(payload);
  const invalidFields = fields.filter((field) => !ability.can(action, authZEntity, field));

  if (invalidFields.length > 0) {
    throw new ForbiddenException(`You are not authorized to update the following fields: ${invalidFields.join(", ")}`);
  }
};
