/* eslint-disable @typescript-eslint/no-explicit-any */
import { Model, Types } from "mongoose";
import { Job, JobProfile } from "../../../models";
import { getGeoLocationFromAddress } from "../../../common/helper";

/**
 * Turns a job's `location` or a profile's `address` — free text from a Places
 * picker, anything from "Manchester" to a full street address — into a map
 * point on the same document (`geo`), so job matching can measure distance.
 *
 * Runs off the request path, from the geocode queue, and from backfills that
 * need the same result without a worker. It records the text each point came
 * from (`geocodedFrom`), which makes it idempotent: unchanged text costs no
 * geocoding call.
 */

export type GeocodeTarget = "job" | "profile";

export interface GeocodeRequest {
  type: GeocodeTarget;
  id: string;
}

export type GeocodeOutcome = "geocoded" | "unchanged" | "cleared" | "not-found" | "no-result" | "superseded";

/** Address text in, candidate matches out — the shape of `getGeoLocationFromAddress`. */
export type Geocoder = (address: string) => Promise<{ latitude?: number; longitude?: number }[]>;

/** Where each kind of document keeps the text that gets geocoded. */
export const GEOCODE_SOURCES: Record<GeocodeTarget, { model: Model<any>; field: string }> = {
  job: { model: Job, field: "location" },
  profile: { model: JobProfile, field: "address" },
};

/**
 * Geocodes one document's address text into its `geo`.
 *
 * Every write is conditional on the text still being what was read, so if the
 * address changes mid-flight the write lands nowhere and the newer edit's own
 * run wins. Returns what happened, never the coordinates — the outcome is shown
 * on the queue dashboard, and a profile's point is a candidate's home.
 *
 * `geocode` is the Google geocoder unless a caller passes its own — a backfill
 * passes one that caches repeated text and paces its calls.
 */
export const geocodeDocument = async (
  { type, id }: GeocodeRequest,
  geocode: Geocoder = getGeoLocationFromAddress
): Promise<GeocodeOutcome> => {
  if (!Types.ObjectId.isValid(id)) return "not-found";
  const { model, field } = GEOCODE_SOURCES[type];

  const doc = await model
    .findOne({ _id: id, "deleteMarker.status": { $ne: true } })
    .select(`${field} geocodedFrom`)
    .lean<Record<string, unknown>>();
  if (!doc) return "not-found";

  const stored = doc[field];
  const text = typeof stored === "string" ? stored.trim() : "";
  const stillSame = { _id: id, [field]: stored === undefined ? { $exists: false } : stored };

  if (!text) {
    const { modifiedCount } = await model.updateOne(stillSame, { $unset: { geo: 1, geocodedFrom: 1 } });
    return modifiedCount ? "cleared" : "unchanged";
  }

  if (text === doc.geocodedFrom) return "unchanged";

  const [hit] = await geocode(text);
  const lat = hit?.latitude;
  const lng = hit?.longitude;

  if (typeof lat !== "number" || typeof lng !== "number" || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    // No match, or the geocoder failed (it logs and returns nothing). Drop any
    // point left from the previous text, and leave `geocodedFrom` unset so a
    // later backfill tries this text again.
    await model.updateOne(stillSame, { $unset: { geo: 1, geocodedFrom: 1 } });
    return "no-result";
  }

  const { matchedCount } = await model.updateOne(stillSame, {
    $set: { geo: { type: "Point", coordinates: [lng, lat] }, geocodedFrom: text },
  });
  return matchedCount ? "geocoded" : "superseded";
};
