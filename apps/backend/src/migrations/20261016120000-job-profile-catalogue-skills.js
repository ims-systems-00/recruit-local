/**
 * Moves job profiles onto catalogue skills.
 *
 * `jobprofiles.skills` was one free-text string. It is now an array of
 * `{ skill, level }` rows, each `skill` a skill catalogue id — the shape a job's
 * skills already have, so the two can be matched.
 *
 * - Drops the old string. It is not converted: free text cannot be mapped onto
 *   the catalogue reliably, so candidates pick their skills again. A profile
 *   without `skills` reads back as `[]` (profileSkillsLookupQuery).
 * - Builds `jobprofiles.skills.skill`: "which profiles use this entry?" — the
 *   check that blocks hard-deleting a catalogue skill still in use, and matching.
 *
 * Stored completion is not recomputed here, for the reason given in
 * 20260831120000-completion-complete-fields: a profile whose skills section was
 * complete only through the old text keeps that until its next recompute. Run
 * the backfill after this to bring every profile in line:
 *
 *   pnpm --filter @rl/backend backfill:completion:dev
 *
 * Dev also builds the index via mongoose autoIndex. Idempotent — the $unset
 * only matches strings, and createIndex is a no-op when the index exists.
 *
 * `down` drops the index only. The dropped text cannot be restored.
 */
module.exports = {
  async up(db) {
    await db.collection("jobprofiles").updateMany({ skills: { $type: "string" } }, { $unset: { skills: "" } });
    await db.collection("jobprofiles").createIndex({ "skills.skill": 1 });
  },

  async down(db) {
    await db.collection("jobprofiles").dropIndex({ "skills.skill": 1 });
  },
};
