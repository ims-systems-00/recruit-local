/**
 * Converts job-profile catalog fields from free-form strings into ObjectId
 * references to their catalog collections:
 *   - jobTitle  (string[]) -> ObjectId[]  ref jobtitles
 *   - industry  (string[]) -> ObjectId[]  ref industries
 *   - workMode  (string[]) -> ObjectId[]  ref workmodes
 *   - experienceLevel (string) -> ObjectId ref experiencelevels  (single value)
 *
 * `up`: every distinct non-empty string is matched (case-insensitive) against
 * its catalog, reusing the seeded document when one exists and inserting a new
 * catalog entry otherwise, then the profile field is rewritten to the
 * corresponding ObjectId(s). Values that are already ObjectIds are left
 * untouched, so the migration is idempotent.
 *
 * `down`: maps each ObjectId back to its catalog `name` string.
 *
 * NOTE: run the catalog seeders before this migration so string values map onto
 * the curated catalog entries instead of creating ad-hoc duplicates.
 */
const ARRAY_FIELD_MAP = [
  { field: "jobTitle", collection: "jobtitles" },
  { field: "industry", collection: "industries" },
  { field: "workMode", collection: "workmodes" },
];
const SINGLE_FIELD_MAP = [{ field: "experienceLevel", collection: "experiencelevels" }];

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Resolve a string label to its catalog ObjectId, reusing seeded entries
// (case-insensitive) and inserting a new one only when none exists. `cache`
// memoises lookups within a single field pass.
const resolveId = async (catalog, name, cache, session) => {
  const key = name.toLowerCase();
  let id = cache.get(key);
  if (id) return id;

  const existing = await catalog.findOne(
    { name: { $regex: `^${escapeRegex(name)}$`, $options: "i" } },
    { session }
  );
  if (existing) {
    id = existing._id;
  } else {
    const now = new Date();
    const res = await catalog.insertOne({ name, isActive: true, createdAt: now, updatedAt: now }, { session });
    id = res.insertedId;
  }
  cache.set(key, id);
  return id;
};

module.exports = {
  async up(db, client) {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        const profiles = db.collection("jobprofiles");

        // Array fields: rewrite each string entry to its catalog ObjectId.
        for (const { field, collection } of ARRAY_FIELD_MAP) {
          const catalog = db.collection(collection);
          const cache = new Map();

          const cursor = profiles.find({ [field]: { $elemMatch: { $type: "string" } } }, { session });
          while (await cursor.hasNext()) {
            const doc = await cursor.next();
            const source = Array.isArray(doc[field]) ? doc[field] : [];
            const converted = [];

            for (const entry of source) {
              if (typeof entry !== "string") {
                converted.push(entry); // already-converted reference
                continue;
              }
              const name = entry.trim();
              if (!name) continue;
              converted.push(await resolveId(catalog, name, cache, session));
            }

            await profiles.updateOne({ _id: doc._id }, { $set: { [field]: converted } }, { session });
          }
        }

        // Single fields: rewrite the scalar string to a single catalog ObjectId.
        for (const { field, collection } of SINGLE_FIELD_MAP) {
          const catalog = db.collection(collection);
          const cache = new Map();

          const cursor = profiles.find({ [field]: { $type: "string" } }, { session });
          while (await cursor.hasNext()) {
            const doc = await cursor.next();
            const name = typeof doc[field] === "string" ? doc[field].trim() : "";
            if (!name) {
              await profiles.updateOne({ _id: doc._id }, { $unset: { [field]: "" } }, { session });
              continue;
            }
            const id = await resolveId(catalog, name, cache, session);
            await profiles.updateOne({ _id: doc._id }, { $set: { [field]: id } }, { session });
          }
        }
      });
    } finally {
      await session.endSession();
    }
  },

  async down(db, client) {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        const profiles = db.collection("jobprofiles");

        for (const { field, collection } of ARRAY_FIELD_MAP) {
          const catalog = db.collection(collection);

          const cursor = profiles.find({ [field]: { $elemMatch: { $type: "objectId" } } }, { session });
          while (await cursor.hasNext()) {
            const doc = await cursor.next();
            const source = Array.isArray(doc[field]) ? doc[field] : [];
            const reverted = [];

            for (const entry of source) {
              if (typeof entry === "string") {
                reverted.push(entry);
                continue;
              }
              const cat = await catalog.findOne({ _id: entry }, { session });
              if (cat && cat.name) reverted.push(cat.name);
            }

            await profiles.updateOne({ _id: doc._id }, { $set: { [field]: reverted } }, { session });
          }
        }

        for (const { field, collection } of SINGLE_FIELD_MAP) {
          const catalog = db.collection(collection);

          const cursor = profiles.find({ [field]: { $type: "objectId" } }, { session });
          while (await cursor.hasNext()) {
            const doc = await cursor.next();
            const cat = await catalog.findOne({ _id: doc[field] }, { session });
            if (cat && cat.name) {
              await profiles.updateOne({ _id: doc._id }, { $set: { [field]: cat.name } }, { session });
            }
          }
        }
      });
    } finally {
      await session.endSession();
    }
  },
};
