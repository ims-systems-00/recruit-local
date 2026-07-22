import { Schema, Document, Model } from "mongoose";
import { Tenant } from "../tenant.model";

export type TenantInput = {
  tenantId?: Schema.Types.ObjectId | null;
};

export interface ITenantDoc extends TenantInput, Document {}

export interface ITenantModel<T extends ITenantDoc> extends Model<T> {
  findByTenantId(tenantId: Schema.Types.ObjectId): Promise<T[]>;
}

/**
 * tenantDataPlugin
 * @param {Schema} schema
 * @returns {void}
 * @throws {Error} If the schema is not an instance of mongoose schema
 * @description This plugin adds a tenantId field to the schema and a static method to find by tenantId
 * @example
 * // Add the plugin to a schema
 * schema.plugin(tenantDataPlugin)
 * // Find all documents by tenantId
 * Model.findByTenantId(tenantId)
 */
export const tenantDataPlugin = <T extends ITenantDoc>(schema: Schema<T>): void => {
  if (!(schema instanceof Schema)) throw new Error("The schema must be an instance of mongoose schema");

  const tenantDataSchema = new Schema<ITenantDoc>({
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: Tenant.modelName,
      default: null,
    },
  });

  schema.add(tenantDataSchema);

  // Add a static method to find documents by tenantId
  schema.static("findByTenantId", function (tenantId: Schema.Types.ObjectId) {
    return this.find({ tenantId });
  });
};
