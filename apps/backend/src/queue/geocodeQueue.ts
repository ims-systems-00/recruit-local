import { Types } from "mongoose";
import { ReusableQueue } from "./Queue";
import { GeocodeOutcome, GeocodeRequest, GeocodeTarget, geocodeDocument } from "../v1/modules/location/geocode.service";
import { enqueueJobFanout } from "./jobFanoutQueue";
import { enqueueProfileFeedRebuild } from "./profileFeedRebuildQueue";

/**
 * Outcomes after which the document's `geo` may differ from what its job feeds
 * were scored with. `no-result` drops any earlier point, so it counts too.
 */
const GEO_MAY_HAVE_CHANGED = new Set<GeocodeOutcome>(["geocoded", "cleared", "no-result"]);

/**
 * Distance is part of the job match, and the point lands after the keyword
 * chain has already scored the feeds, so a changed point rescores them: a job's
 * fan-out, or a profile's feed rebuild. The backfill script calls
 * `geocodeDocument` directly and so triggers neither.
 */
const processGeocode = async (request: GeocodeRequest): Promise<GeocodeOutcome> => {
  const outcome = await geocodeDocument(request);
  if (GEO_MAY_HAVE_CHANGED.has(outcome)) {
    if (request.type === "job") await enqueueJobFanout(request.id);
    else await enqueueProfileFeedRebuild(request.id);
  }
  return outcome;
};

/**
 * Geocodes a job's `location` or a profile's `address` off the request path
 * whenever it is set or changed, so saving never waits on Google and a failed
 * lookup never fails a save. The work itself is `geocodeDocument`; see there
 * for how a stale or superseded run is handled.
 */
export const geocodeQueue = new ReusableQueue<GeocodeRequest>("geocode-queue", (job) => processGeocode(job.data));

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
