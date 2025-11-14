import {
  Schema,
  Document,
  Model,
  PaginateModel,
  PaginateResult,
  UpdateWriteOpResult,
  QueryWithHelpers,
} from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

// Define an interface for soft delete document
export interface ISoftDeleteDoc extends Document {
  deleteMarker: {
    status: boolean;
    deletedAt: Date | null;
    dateScheduled: Date | null;
  };
}

// Define the interface for the model with soft delete methods
export interface ISoftDeleteModel<T extends ISoftDeleteDoc> extends Model<T>, PaginateModel<T> {
  softDelete(query: Record<string, any>, options?: any): Promise<{ deleted: number }>;
  restore(query: Record<string, any>): Promise<{ restored: number }>;
  paginateAndExcludeDeleted(query: Record<string, any>, options?: any): QueryWithHelpers<PaginateResult<T>, T>;
  findOneWithExcludeDeleted(query: Record<string, any>): QueryWithHelpers<T | null, T>;
}

/**
 *  softDeletePlugin
 * @param {Schema} schema - Mongoose schema
 * @throws {Error} If the schema is not an instance of mongoose Schema
 * @description This plugin adds soft delete functionality to the schema with pagination support
 * @example
 * // Add the plugin to a schema
 * schema.plugin(softDeletePlugin);
 * // Soft delete documents
 * Model.softDelete(query);
 * // Restore soft deleted documents
 * Model.restore(query);
 * // Find documents with out soft deleted documents
 * Model.paginateAndExcludeDeleted(query, options);
 * // Find one document with out soft deleted documents
 * Model.findOneWithExcludeDeleted(query);
 */
export const softDeletePlugin = <T extends ISoftDeleteDoc>(schema: Schema<T>): void => {
  if (!(schema instanceof Schema)) throw new Error("The schema must be an instance of mongoose schema");

  let softDeleteSchema = new Schema<ISoftDeleteDoc>({
    deleteMarker: {
      status: {
        type: Boolean,
        default: false,
      },
      deletedAt: {
        type: Date,
        default: null,
      },
      dateScheduled: {
        type: Date,
        default: null,
      },
    },
  });
  schema.add(softDeleteSchema);
  schema.plugin(mongoosePaginate);

  // Static method to soft delete documents
  schema.static("softDelete", async function (query: Record<string, any>, options: any = {}) {
    try {
      const result = (await this.updateMany(
        {
          ...query,
          "deleteMarker.status": false,
        },
        {
          $set: {
            "deleteMarker.status": true,
            "deleteMarker.deletedAt": new Date(),
            "deleteMarker.dateScheduled": new Date(),
          },
        },
        options
      )) as UpdateWriteOpResult;

      return { deleted: result.modifiedCount || 0 };
    } catch (err: any) {
      throw new Error(err.name + ": " + err.message);
    }
  });

  // Static method to restore soft deleted documents
  schema.static("restore", async function (query: Record<string, any>) {
    try {
      const result = (await this.updateMany(
        {
          ...query,
          "deleteMarker.status": true,
        },
        {
          $set: {
            "deleteMarker.status": false,
            "deleteMarker.deletedAt": null,
            "deleteMarker.dateScheduled": null,
          },
        }
      )) as UpdateWriteOpResult;

      return { restored: result.modifiedCount || 0 };
    } catch (err: any) {
      throw new Error(err.name + ": " + err.message);
    }
  });

  // Static method to find with out soft deleted documents
  schema.static("paginateAndExcludeDeleted", function (query: Record<string, any>, options: any) {
    const self = this as ISoftDeleteModel<T>;
    return self.paginate({ ...query, "deleteMarker.status": false }, options);
  });

  // Static method to find not deleted document
  schema.static("findOneWithExcludeDeleted", function (query: Record<string, any>) {
    const self = this as ISoftDeleteModel<T>;
    return self.findOne({ ...query, "deleteMarker.status": false });
  });
};
