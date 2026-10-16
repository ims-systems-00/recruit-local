import assert from "assert";
import { WORKPLACE_ENUMS } from "@rl/types";

/**
 * Location matching: how well the job's way of working and its place suit the
 * candidate. Two fits, multiplied:
 *
 * - **Work-mode fit.** The job's `workplace` against the best of the
 *   candidate's preferred work modes, read off `MODE_FIT`. Asymmetric on
 *   purpose: someone who prefers the office can still do a remote job, but a
 *   remote-only candidate is a poor fit for an onsite one. A candidate with no
 *   stated preference is not marked down for it.
 * - **Distance fit.** Full credit within `FULL_CREDIT_KM` of the job, falling in
 *   a straight line to nothing at `ZERO_CREDIT_KM`, which is further out for a
 *   hybrid job because the commute is not daily. A remote job ignores distance.
 *   Needs coordinates for both sides; without them distance simply does not
 *   count, and the fit is the work mode alone.
 *
 * Not applicable when the job gives neither a workplace nor coordinates. Every
 * input is either the job as a candidate may read it or the candidate's own
 * profile, so the result can be shown to them as it is.
 *
 * Pure and synchronous — hand it both sides already resolved; it does no
 * database work.
 */

/** Work-mode fit, by the job's workplace and then the candidate's preferred mode. */
const MODE_FIT: Record<WORKPLACE_ENUMS, Record<WORKPLACE_ENUMS, number>> = {
  [WORKPLACE_ENUMS.REMOTE]: {
    [WORKPLACE_ENUMS.REMOTE]: 1,
    [WORKPLACE_ENUMS.HYBRID]: 0.9,
    [WORKPLACE_ENUMS.ONSITE]: 0.7,
  },
  [WORKPLACE_ENUMS.HYBRID]: {
    [WORKPLACE_ENUMS.REMOTE]: 0.5,
    [WORKPLACE_ENUMS.HYBRID]: 1,
    [WORKPLACE_ENUMS.ONSITE]: 0.9,
  },
  [WORKPLACE_ENUMS.ONSITE]: {
    [WORKPLACE_ENUMS.REMOTE]: 0.3,
    [WORKPLACE_ENUMS.HYBRID]: 0.8,
    [WORKPLACE_ENUMS.ONSITE]: 1,
  },
};

/** Within this many km of the job, distance costs nothing. */
const FULL_CREDIT_KM = 10;

/**
 * Distance at which the distance fit reaches 0, by the job's workplace. A job
 * with coordinates but no workplace is treated as onsite, the stricter case.
 */
const ZERO_CREDIT_KM: Record<WORKPLACE_ENUMS.ONSITE | WORKPLACE_ENUMS.HYBRID, number> = {
  [WORKPLACE_ENUMS.ONSITE]: 60,
  [WORKPLACE_ENUMS.HYBRID]: 100,
};

const EARTH_RADIUS_KM = 6371;

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface LocationMatchJob {
  /** The job's `workplace`. */
  workplace?: unknown;
  /** The job's coordinates, once its location is geocoded. */
  point?: GeoPoint | null;
}

export interface LocationMatchProfile {
  /** The candidate's preferred work modes, as catalogue names ("Remote") or `{ name }` entries. */
  workModes?: unknown;
  /** The candidate's coordinates, once their address is geocoded. */
  point?: GeoPoint | null;
}

export interface LocationMatchResult {
  /** 0-1, unrounded. */
  ratio: number;
  /** False when the job gives neither a workplace nor coordinates, so there is nothing to match. */
  applicable: boolean;
}

const WORKPLACES = new Set<string>(Object.values(WORKPLACE_ENUMS));

/**
 * A work-mode name or workplace value as a `WORKPLACE_ENUMS` member: "On-site",
 * "Onsite" and "onsite" all read as onsite. Anything else — a catalogue entry
 * an admin added under another name — is `null`.
 */
const toWorkplace = (name: unknown): WORKPLACE_ENUMS | null => {
  if (typeof name !== "string") return null;
  const normalized = name.toLowerCase().replace(/[^a-z]/g, "");
  return WORKPLACES.has(normalized) ? (normalized as WORKPLACE_ENUMS) : null;
};

/** The candidate's preferred modes that map onto a workplace. Anything that is not an array reads as none. */
const toPreferredModes = (workModes: unknown): WORKPLACE_ENUMS[] => {
  if (!Array.isArray(workModes)) return [];
  return workModes
    .map((mode) => toWorkplace(typeof mode === "object" && mode !== null ? (mode as { name?: unknown }).name : mode))
    .filter((mode): mode is WORKPLACE_ENUMS => mode !== null);
};

/**
 * Whether a point is usable. (0, 0) is rejected as well as out-of-range values:
 * the Location model stores 0/0 when geocoding fails, and no real address sits
 * there.
 */
const isUsablePoint = (point: GeoPoint | null | undefined): point is GeoPoint =>
  !!point &&
  Number.isFinite(point.lat) &&
  Number.isFinite(point.lng) &&
  Math.abs(point.lat) <= 90 &&
  Math.abs(point.lng) <= 180 &&
  !(point.lat === 0 && point.lng === 0);

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Great-circle distance between two points, in km (haversine). */
export const distanceKm = (a: GeoPoint, b: GeoPoint): number => {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
};

/** Distance fit for an onsite or hybrid job: 1 within `FULL_CREDIT_KM`, then linear down to 0. */
export const distanceFit = (km: number, workplace: WORKPLACE_ENUMS.ONSITE | WORKPLACE_ENUMS.HYBRID): number => {
  if (km <= FULL_CREDIT_KM) return 1;
  const zeroAt = ZERO_CREDIT_KM[workplace];
  return Math.max(0, 1 - (km - FULL_CREDIT_KM) / (zeroAt - FULL_CREDIT_KM));
};

/**
 * Scores how well a job's workplace and location suit a candidate.
 *
 * @param job The job's `workplace`, and its coordinates when known.
 * @param profile The candidate's preferred work-mode names, and their coordinates when known.
 */
export const matchLocation = (job: LocationMatchJob, profile: LocationMatchProfile): LocationMatchResult => {
  const workplace = toWorkplace(job.workplace);

  let modeFit: number | null = null;
  if (workplace) {
    const preferred = toPreferredModes(profile.workModes);
    modeFit = preferred.length ? Math.max(...preferred.map((mode) => MODE_FIT[workplace][mode])) : 1;
  }

  let distance: number | null = null;
  if (workplace !== WORKPLACE_ENUMS.REMOTE && isUsablePoint(job.point) && isUsablePoint(profile.point)) {
    distance = distanceFit(distanceKm(job.point, profile.point), workplace ?? WORKPLACE_ENUMS.ONSITE);
  }

  if (modeFit === null && distance === null) return { ratio: 0, applicable: false };
  return { ratio: (modeFit ?? 1) * (distance ?? 1), applicable: true };
};

// Runnable check for the scoring rules. No database or Redis is touched.
// Run with: pnpm --filter @rl/backend exec ts-node src/v1/modules/job/match/location.ts
const demo = () => {
  const { REMOTE, HYBRID, ONSITE } = WORKPLACE_ENUMS;
  const close = (actual: number, expected: number, tolerance = 1e-9) => Math.abs(actual - expected) < tolerance;

  const london = { lat: 51.5074, lng: -0.1278 };
  const paris = { lat: 48.8566, lng: 2.3522 };
  // 28 km due north of London: 1 degree of latitude is EARTH_RADIUS_KM * pi / 180 km.
  const north28 = { lat: london.lat + 28 / ((EARTH_RADIUS_KM * Math.PI) / 180), lng: london.lng };

  assert(close(distanceKm(london, paris), 343.5, 1), "London to Paris is about 343 km");
  assert(close(distanceKm(london, north28), 28, 1e-6), "28 km due north measures 28 km");
  assert(distanceFit(10, ONSITE) === 1 && distanceFit(4, HYBRID) === 1, "within 10 km is full credit");
  assert(close(distanceFit(35, ONSITE), 0.5), "onsite halves at 35 km");
  assert(close(distanceFit(28, HYBRID), 0.8), "hybrid at 28 km keeps 0.8");
  assert(distanceFit(60, ONSITE) === 0 && distanceFit(500, HYBRID) === 0, "past the zero point is 0");

  // The worked example: hybrid job, hybrid candidate, 28 km apart -> 1 x 0.8.
  const example = matchLocation({ workplace: HYBRID, point: london }, { workModes: ["Hybrid"], point: north28 });
  assert(example.applicable && close(example.ratio, 0.8, 1e-6), "worked example scores 0.8");

  assert(
    close(matchLocation({ workplace: REMOTE }, { workModes: ["Hybrid"] }).ratio, 0.9),
    "remote job, hybrid candidate"
  );
  assert(
    matchLocation({ workplace: REMOTE, point: london }, { workModes: ["Remote"], point: paris }).ratio === 1,
    "a remote job ignores distance"
  );
  assert(close(matchLocation({ workplace: ONSITE }, { workModes: ["Remote"] }).ratio, 0.3), "remote-only for onsite");
  assert(
    matchLocation({ workplace: ONSITE }, { workModes: [{ name: "Remote" }, { name: "On-site" }] }).ratio === 1,
    "the best of several modes counts, from names or { name } entries"
  );
  assert(
    matchLocation({ workplace: HYBRID }, { workModes: [] }).ratio === 1,
    "no stated preference is not marked down"
  );
  assert(
    matchLocation({ workplace: HYBRID }, { workModes: ["Flexible"] }).ratio === 1,
    "unknown mode names are ignored"
  );
  assert(
    close(matchLocation({ workplace: ONSITE, point: london }, { workModes: ["Onsite"] }).ratio, 1),
    "one side without coordinates scores work mode alone"
  );
  assert(
    matchLocation({ workplace: ONSITE, point: { lat: 0, lng: 0 } }, { point: paris }).ratio === 1,
    "a 0/0 point counts as no coordinates"
  );
  assert(!matchLocation({}, { workModes: ["Remote"] }).applicable, "no workplace and no coordinates is not applicable");
  assert(!matchLocation({ workplace: "anywhere" }, {}).applicable, "an unknown workplace reads as none");
  const placeOnly = matchLocation({ point: london }, { point: { lat: london.lat + 0.3, lng: london.lng } });
  assert(placeOnly.applicable && placeOnly.ratio < 1, "coordinates without a workplace score distance as onsite");

  console.log("location match self-check ok");
};

if (require.main === module) demo();
