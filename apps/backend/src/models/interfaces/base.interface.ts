import { Document } from "mongoose";

export interface IBaseDoc extends Document {
  createdAt: Date;
  updatedAt: Date;
}
