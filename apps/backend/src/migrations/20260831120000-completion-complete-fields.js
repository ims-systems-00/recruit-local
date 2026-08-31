/**
 * Adds `completion.completeFields` to tenants and job profiles.
 *
 * Completion scoring moved from all-or-nothing per section to per field: every
 * field in a section now carries an equal share of that section's weight, so
 * filling 4 of 5 fields in a 15-point section earns 12 instead of 0. The
 * satisfied field keys are the new source of truth; `completeSections` stays as
 * a derived convenience for existing reads.
 *
 * This migration only makes the shape uniform. It does NOT recompute — the
 * predicates ("is this org's logo set?", "does this candidate have 3 skills?")
 * live in the recompute services and reach across several collections, and
 * re-implementing them in raw JS here would fork them. Run the backfill after
 * this to fill in real values:
 *
 *   pnpm --filter @rl/backend backfill:completion:dev
 *
 * Until that runs, `expandCompletion` falls back to treating every field of a
 * stored complete section as satisfied, so percentages hold at their old value
 * rather than dropping to 0.
 *
 * Idempotent — filtered on the field being absent.
 */
const COLLECTIONS = ["tenants", "jobprofiles"];

module.exports = {
  async up(db) {
    for (const name of COLLECTIONS) {
      await db
        .collection(name)
        .updateMany(
          { completion: { $exists: true }, "completion.completeFields": { $exists: false } },
          { $set: { "completion.completeFields": [] } }
        );
    }
  },

  async down(db) {
    for (const name of COLLECTIONS) {
      await db.collection(name).updateMany({}, { $unset: { "completion.completeFields": "" } });
    }
  },
};
