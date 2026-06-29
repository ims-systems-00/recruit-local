import { Schema, model, Model, PaginateModel, AggregatePaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { softDeletePlugin, ISoftDeleteDoc, ISoftDeleteModel } from "./plugins/soft-delete.plugin";
import { modelNames } from "./constants";

export interface ISalaryInput {
  jobTitle: string;
  location: string;
  experienceLevel: string;
  minSalary: number;
  maxSalary: number;
  currency: string;
}

export interface ISalaryDoc extends ISalaryInput, ISoftDeleteDoc {}

interface ISalaryModel
  extends Model<ISalaryDoc>,
    ISoftDeleteModel<ISalaryDoc>,
    PaginateModel<ISalaryDoc>,
    AggregatePaginateModel<ISalaryDoc> {}

const salarySchema = new Schema<ISalaryDoc>(
  {
    jobTitle: { type: String, required: true },
    location: { type: String, required: true },
    experienceLevel: { type: String, required: true },
    minSalary: { type: Number, required: true },
    maxSalary: { type: Number, required: true },
    currency: { type: String, required: true },
  },
  { timestamps: true }
);

salarySchema.plugin(softDeletePlugin);
salarySchema.plugin(mongoosePaginate);
salarySchema.plugin(aggregatePaginate);

export const Salary = model<ISalaryDoc, ISalaryModel>(modelNames.SALARY, salarySchema);
