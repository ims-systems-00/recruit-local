/**
 * Builds the indexes behind a job's skills and values.
 *
 * - `skillcatalogs.normalizedName`, unique among live entries: one catalogue skill
 *   per name, whatever its case or spacing. Soft-deleted entries are left out so
 *   a deleted name can be added again.
 * - `jobs.skills.skill` / `jobs.values.value`: "which jobs use this entry?" — the
 *   check that blocks hard-deleting a skill or value still in use, and matching.
 *
 * No document reshaping: jobs without `skills`/`values` read back as `[]`,
 * because the job read pipeline fills them in (jobSkillsLookupQuery /
 * jobValuesLookupQuery).
 *
 * Dev builds these via mongoose autoIndex; this migration covers existing/prod
 * data. Idempotent — createIndex is a no-op when the index already exists. The
 * unique index would fail if live entries already shared a name; none can, as
 * the catalogue is only filled by the next migration (seed-skill-catalog).
 */
module.exports = {
  async up(db) {
    await db
      .collection("skillcatalogs")
      .createIndex({ normalizedName: 1 }, { unique: true, partialFilterExpression: { "deleteMarker.status": false } });
    await db.collection("jobs").createIndex({ "skills.skill": 1 });
    await db.collection("jobs").createIndex({ "values.value": 1 });
  },

  async down(db) {
    await db.collection("skillcatalogs").dropIndex({ normalizedName: 1 });
    await db.collection("jobs").dropIndex({ "skills.skill": 1 });
    await db.collection("jobs").dropIndex({ "values.value": 1 });
  },
};
