/**
 * Gives every experience level a numeric span of years.
 *
 * A job states its requirement as a number (`Job.yearOfExperience`), while a
 * candidate states theirs as a reference to an `ExperienceLevel` whose only
 * distinguishing content was a name and a prose description. The two were not
 * comparable, so the ranking pipeline had no way to score experience. These two
 * fields are the shared unit.
 *
 * The seeded descriptions already carried the ranges in prose ("1–3 years of
 * professional experience"), so the backfill below matches the seeder exactly
 * rather than inventing new bands. The three leadership levels never named a
 * range in prose and are given one consistent with their seniority. `Executive`
 * is deliberately open-ended: `maxYears: null` means "and up".
 *
 * Matched on name because that is the only stable identifier — ids are
 * generated per environment. Levels created by an admin outside the seeded set
 * are left alone with both fields null, which the matcher reads as "not
 * comparable" and drops the signal for, rather than scoring the candidate on a
 * guess.
 *
 * Idempotent: each update is filtered on the level not already having a span,
 * so re-running cannot overwrite a value an admin has since tuned.
 */
const BANDS = [
  { name: "Fresher", minYears: 0, maxYears: 1 },
  { name: "Intermediate", minYears: 1, maxYears: 3 },
  { name: "Specialist", minYears: 3, maxYears: 5 },
  { name: "Expert", minYears: 5, maxYears: 8 },
  { name: "Lead", minYears: 8, maxYears: 12 },
  { name: "Manager", minYears: 8, maxYears: 15 },
  { name: "Director", minYears: 12, maxYears: 20 },
  { name: "Executive", minYears: 15, maxYears: null },
];

module.exports = {
  async up(db) {
    const collection = db.collection("experiencelevels");

    // Every level gets the fields, so the shape is uniform and a level with no
    // span is explicitly null rather than merely absent.
    await collection.updateMany({ minYears: { $exists: false } }, { $set: { minYears: null, maxYears: null } });

    for (const { name, minYears, maxYears } of BANDS) {
      await collection.updateOne(
        { name, $or: [{ minYears: null }, { minYears: { $exists: false } }] },
        { $set: { minYears, maxYears } }
      );
    }
  },

  async down(db) {
    await db.collection("experiencelevels").updateMany({}, { $unset: { minYears: "", maxYears: "" } });
  },
};
