import { Schema, model, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { IBaseDoc } from "./interfaces/base.interface";
import { ISkillCatalog } from "@rl/types";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SkillCatalogInput extends ISkillCatalog {}

export interface ISkillCatalogDoc extends SkillCatalogInput, ISoftDeleteDoc, IBaseDoc {
  /** Derived from `name` by the hooks below — never written by a client. */
  normalizedName: string;
}

interface ISkillCatalogModel
  extends
    Model<ISkillCatalogDoc>,
    ISoftDeleteModel<ISkillCatalogDoc>,
    PaginateModel<ISkillCatalogDoc>,
    AggregatePaginateModel<ISkillCatalogDoc> {}

/**
 * The comparison form of a skill name: "  Manual  Handling " -> "manual handling".
 * Backs the duplicate check and the search, so both treat case and spacing alike.
 */
export const normalizeSkillName = (name: string) => name.trim().replace(/\s+/g, " ").toLowerCase();

const skillCatalogSchema = new Schema<ISkillCatalogDoc>(
  {
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Keep normalizedName in step with name on every write path: save() and create()
// run validate; findOneAndUpdate/updateOne run only query middleware.
skillCatalogSchema.pre("validate", function (next) {
  if (this.isModified("name")) this.normalizedName = normalizeSkillName(this.name);
  next();
});

skillCatalogSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
  const name = this.get("name");
  if (typeof name === "string") this.set("normalizedName", normalizeSkillName(name));
  next();
});

// One live entry per name. Soft-deleted entries are left out, so a deleted name
// can be created again.
skillCatalogSchema.index(
  { normalizedName: 1 },
  { unique: true, partialFilterExpression: { "deleteMarker.status": false } }
);

skillCatalogSchema.plugin(softDeletePlugin);
skillCatalogSchema.plugin(mongoosePaginate);
skillCatalogSchema.plugin(aggregatePaginate);

export const SkillCatalog = model<ISkillCatalogDoc, ISkillCatalogModel>(modelNames.SKILL_CATALOG, skillCatalogSchema);
