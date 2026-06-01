import { Schema } from "mongoose";

export interface IBoardSettings {
  boardBackground: string;
  boardSortBy?: string;
  boardSortOrder?: "asc" | "desc";
}

export const boardSettingsSchema = new Schema<IBoardSettings>(
  {
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
