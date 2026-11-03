import { Schema, model, Model, PaginateModel, AggregatePaginateModel, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";
import { userOwnedPlugin, IUserOwnedInput } from "./plugins/userOwned.plugin";
import { jobProfilePlugin, JobProfileInput } from "./plugins/jobProfile.plugin";
import { IBaseDoc } from "./interfaces/base.interface";
import { ITraining } from "@rl/types";

export interface TrainingInput extends ITraining, IUserOwnedInput, JobProfileInput {
  // Skill catalogue entries, in the order picked — the same catalogue jobs use,
  // so training skills compare directly with a job's.
  skills: Types.ObjectId[];
  // Certificate file (FileMedia ref). The candidate submits the transient
  // `certificateStorage` template; the server persists this id.
  certificateId?: Types.ObjectId | null;
}
export interface ITrainingDoc extends TrainingInput, IBaseDoc, ISoftDeleteDoc {}

interface ITrainingModel
  extends
    Model<ITrainingDoc>,
    ISoftDeleteModel<ITrainingDoc>,
    PaginateModel<ITrainingDoc>,
    AggregatePaginateModel<ITrainingDoc> {}

const trainingSchema = new Schema<ITrainingDoc>(
  {
    organizationName: { type: String, required: true },
    courseName: { type: String, required: true },
    skills: { type: [{ type: Schema.Types.ObjectId, ref: modelNames.SKILL_CATALOG }], default: [] },
    isCurrentlyEnrolled: { type: Boolean, default: false },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    certificateId: {
      type: Schema.Types.ObjectId,
      ref: modelNames.FILE_MEDIA,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

trainingSchema.plugin(softDeletePlugin);
trainingSchema.plugin(mongoosePaginate);
trainingSchema.plugin(aggregatePaginate);
trainingSchema.plugin(userOwnedPlugin);
trainingSchema.plugin(jobProfilePlugin);

export const Training = model<ITrainingDoc, ITrainingModel>(modelNames.TRAINING, trainingSchema);
