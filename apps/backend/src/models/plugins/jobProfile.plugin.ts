import { Schema, Document, Model } from "mongoose";
import { JobProfile } from "../job-profile.model";

// 1. Define the input type for the fields we are adding
export type JobProfileInput = {
  jobProfileId?: Schema.Types.ObjectId | null;
};

// 2. Define the Document interface combining the input and Mongoose Document
export interface IJobProfileDoc extends JobProfileInput, Document {}

// 3. Define the Model interface including the new static methods
export interface IJobProfileModel<T extends IJobProfileDoc> extends Model<T> {
  findByJobProfileId(jobProfileId: Schema.Types.ObjectId): Promise<T[]>;
}

/**
 * jobProfilePlugin
 * @param {Schema} schema
 * @returns {void}
 * @throws {Error} If the schema is not an instance of mongoose schema
 * @description This plugin adds job profile fields (title, department, etc.) and helper static methods.
 * @example
 * // Add the plugin to a User schema
 * userSchema.plugin(jobProfilePlugin);
 * // Find all "Software Engineer" documents
 * User.findByJobProfileId(jobProfileId);
 */
export const jobProfilePlugin = <T extends IJobProfileDoc>(schema: Schema<T>): void => {
  if (!(schema instanceof Schema)) throw new Error("The schema must be an instance of mongoose schema");

  // Define the schema definition for job profile data
  const jobProfileSchema = new Schema<IJobProfileDoc>({
    jobProfileId: {
      type: Schema.Types.ObjectId,
      ref: JobProfile.modelName,
      default: null,
    },
  });

  // Add the fields to the host schema
  schema.add(jobProfileSchema);

  // --- Static Methods ---
  schema.statics.findByJobProfileId = function (jobProfileId: Schema.Types.ObjectId) {
    return this.find({ jobProfileId }).exec();
  };
};
