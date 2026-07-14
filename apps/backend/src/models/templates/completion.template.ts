import { Schema } from "mongoose";

/**
 * Shared sub-schema for a stored completion result. Persisted lean (percentage +
 * the list of complete section keys); the full breakdown is hydrated at the
 * response layer from the section config in @rl/types. `percentage` is indexed
 * so documents can be sorted/filtered by completion.
 */
export const completionMongooseDefinition = new Schema(
  {
    percentage: { type: Number, default: 0, index: true },
    completeSections: { type: [String], default: [] },
    computedAt: { type: Date, default: null },
  },
  { _id: false }
);
