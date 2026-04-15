import mongoose from "mongoose";

/**
 * Recursively traverses a query object and casts string IDs to Mongoose ObjectIds.
 * Safe to use with any complex query structure (nested $or, $and, $in).
 * * @param query - The query object or array to sanitize
 * @returns A new deep copy of the query with ObjectIds typed correctly
 */
export const sanitizeQueryIds = <T = unknown>(query: T): T => {
  // 1. Handle Arrays (recurse over items, useful for $or, $and lists)
  if (Array.isArray(query)) {
    return query.map((item) => sanitizeQueryIds(item)) as unknown as T;
  }

  // 2. Handle Objects (recurse over keys)
  if (query && typeof query === "object" && query.constructor === Object) {
    const newQuery: unknown = {};

    for (const key in query) {
      const value = (query as unknown)[key];

      const isIdField = key === "_id" || key.endsWith("Id");

      // Case A: Exact match on '_id' -> Cast String to ObjectId
      if (isIdField && typeof value === "string" && mongoose.Types.ObjectId.isValid(value)) {
        newQuery[key] = new mongoose.Types.ObjectId(value);
      }

      // Case B: Operator query on '_id' with '$in' -> Cast array items
      else if (isIdField && value && typeof value === "object" && "$in" in value && Array.isArray(value.$in)) {
        newQuery[key] = {
          ...value,
          $in: value.$in.map((id: unknown) =>
            typeof id === "string" && mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id
          ),
        };
      }

      // Case C: Recurse for all other keys (nested objects, logical operators)
      else {
        newQuery[key] = sanitizeQueryIds(value);
      }
    }

    return newQuery as T;
  }

  // 3. Return primitives as-is (numbers, booleans, null)
  return query;
};
