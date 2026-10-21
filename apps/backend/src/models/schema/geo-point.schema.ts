import { Schema } from "mongoose";

/** A GeoJSON point. `coordinates` is [longitude, latitude] — longitude first, as GeoJSON orders it. */
export interface IGeoPoint {
  type: "Point";
  coordinates: [number, number];
}

export const geoPointSchema = new Schema<IGeoPoint>(
  {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },

    coordinates: {
      type: [Number],
      required: true,
    },
  },
  { _id: false }
);
