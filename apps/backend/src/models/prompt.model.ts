import { Schema, model, Model, PaginateModel, AggregatePaginateModel, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { IBaseDoc } from "./interfaces/base.interface";
import { PromptConfigDto } from "@rl/types";

export interface IPromptInput {
  /** Stable address, e.g. "agent.system.base". Never changes once shipped. */
  name: string;
  /** Monotonic per name. Allocated by the service, never supplied by a client. */
  version: number;
  content: string;
  /** The `{{placeholders}}` this version expects, for the editor's benefit. */
  variables?: string[];
  /** Movable pointers onto this version, e.g. ["latest", "production"]. */
  labels?: string[];
  /** Why this version exists — the commit message of a prompt change. */
  commitMessage?: string;
  config?: PromptConfigDto;
  createdBy?: Types.ObjectId;
}

export interface IPromptDoc extends IPromptInput, ISoftDeleteDoc, IBaseDoc {}

export interface IPromptModel
  extends
    Model<IPromptDoc>,
    ISoftDeleteModel<IPromptDoc>,
    PaginateModel<IPromptDoc>,
    AggregatePaginateModel<IPromptDoc> {}

/**
 * One document per prompt *version*. Documents are append-only: editing a
 * prompt writes a new version rather than mutating an existing one, which is
 * what makes history and rollback free.
 *
 * Deliberately not tenant-scoped — prompts are platform-owned infrastructure,
 * like the job title and industry catalogues.
 */
const promptSchema = new Schema<IPromptDoc>(
  {
    name: { type: String, required: true, trim: true },
    version: { type: Number, required: true, min: 1 },
    content: { type: String, required: true },
    variables: { type: [String], default: [] },
    labels: { type: [String], default: [] },
    commitMessage: { type: String },
    config: {
      model: { type: String },
      temperature: { type: Number },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: modelNames.USER,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

promptSchema.plugin(softDeletePlugin);
promptSchema.plugin(mongoosePaginate);
promptSchema.plugin(aggregatePaginate);

// Version allocation reads the current max and writes max+1, which two
// concurrent saves can both win. This index is what turns that race into a
// duplicate-key error the service retries, instead of two v4s.
promptSchema.index({ name: 1, version: 1 }, { unique: true });

// Multikey unique: no two versions of the same name may carry the same label.
// The "one `production` per prompt" rule therefore holds at the database level,
// so a half-applied label move fails loudly rather than silently duplicating.
//
// The partial filter is load-bearing, not an optimisation. Mongo indexes an
// empty array as a single `undefined` key, so without it the *second* version
// to lose all of its labels would collide with the first — which is the normal
// state of any prompt past its third version.
promptSchema.index({ name: 1, labels: 1 }, { unique: true, partialFilterExpression: { labels: { $type: "string" } } });

export const Prompt = model<IPromptDoc, IPromptModel>(modelNames.PROMPT, promptSchema);
