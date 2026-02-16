import { Schema, Types } from "mongoose";
import { modelNames } from "../constants";

export interface IBoardSettings {
  boardColumnOrder: Types.ObjectId[];
  boardBackground: string;
  boardSortBy?: string;
  boardSortOrder?: "asc" | "desc";
}

export const boardSettingsSchema = new Schema<IBoardSettings>(
  {
    boardColumnOrder: [
      {
        type: Schema.Types.ObjectId,
        ref: modelNames.STATUS,
        required: true,
      },
    ],

    boardBackground: {
      type: String,
      default: "#ffffff",
    },

    boardSortBy: {
      type: String,
      default: "rank",
    },

    boardSortOrder: {
      type: String,
      enum: ["asc", "desc"],
      default: "asc",
    },
  },
  {
    _id: false,
    timestamps: false,
  }
);
