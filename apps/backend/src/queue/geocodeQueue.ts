import { Types } from "mongoose";
import { ReusableQueue } from "./Queue";
import { GeocodeRequest, GeocodeTarget, geocodeDocument } from "../v1/modules/location/geocode.service";

/**
 * Geocodes a job's `location` or a profile's `address` off the request path
 * whenever it is set or changed, so saving never waits on Google and a failed
 * lookup never fails a save. The work itself is `geocodeDocument`; see there
 * for how a stale or superseded run is handled.
 */
export const geocodeQueue = new ReusableQueue<GeocodeRequest>("geocode-queue", (job) => geocodeDocument(job.data));

const enqueue = async (type: GeocodeTarget, id: unknown): Promise<void> => {
  if (!id) return;
  const strId = String(id);
  if (!Types.ObjectId.isValid(strId)) return;
  await geocodeQueue.addJob("geocode", { type, id: strId });
};

/** Fire-and-forget: geocode a job's location after it is set or changed. */
export const enqueueJobGeocode = (jobId: unknown) => enqueue("job", jobId);

/** Fire-and-forget: geocode a job profile's address after it is set or changed. */
export const enqueueProfileGeocode = (jobProfileId: unknown) => enqueue("profile", jobProfileId);
