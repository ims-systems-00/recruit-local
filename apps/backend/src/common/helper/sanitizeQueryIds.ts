import mongoose from "mongoose";

export const sanitizeQueryIds = <T = unknown>(query: T): T => {
  if (Array.isArray(query)) {
    return query.map((item) => sanitizeQueryIds(item)) as unknown as T;
  }

  if (query && typeof query === "object" && query.constructor === Object) {
    const newQuery: any = {};

    for (const key in query) {
      const value = (query as any)[key];
      const isIdField = key === "_id" || key.endsWith("Id");

      // Case A: Exact string match
      if (isIdField && typeof value === "string" && mongoose.Types.ObjectId.isValid(value)) {
        newQuery[key] = new mongoose.Types.ObjectId(value);
      }

      // Case B: Mongo Operators (e.g., $in, $nin, $ne, $eq) on an ID field
      else if (isIdField && value && typeof value === "object" && value.constructor === Object) {
        newQuery[key] = {};
        for (const opKey in value) {
          const opValue = value[opKey];

          if (Array.isArray(opValue)) {
            // Handle array operators like $in, $nin, $all
            newQuery[key][opKey] = opValue.map((id) =>
              typeof id === "string" && mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id
            );
          } else if (typeof opValue === "string" && mongoose.Types.ObjectId.isValid(opValue)) {
            // Handle direct operators like $ne, $eq
            newQuery[key][opKey] = new mongoose.Types.ObjectId(opValue);
          } else {
            newQuery[key][opKey] = opValue;
          }
        }
      }

      // Case C: Standard recursion for other fields
      else {
        newQuery[key] = sanitizeQueryIds(value);
      }
    }

    return newQuery as T;
  }

  return query;
};
