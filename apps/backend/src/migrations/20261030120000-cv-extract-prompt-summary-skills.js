/**
 * Publishes v2 of `cv.extract.system`, adding rules for the fields the CV
 * upload now writes to the candidate's profile.
 *
 * 1. **summary.** v1 had no rule for it and told the model to leave a field
 *    empty when it "cannot be determined", so a CV without a section headed
 *    like a summary came back with none and the profile's About stayed blank.
 *    The model now copies such a section when there is one and otherwise
 *    composes 2–3 sentences from what the CV states.
 *
 * 2. **skills.** A profile skill is a catalogue entry plus one of the
 *    catalogue's levels, matched by exact name. So the name must be bare
 *    ("React", not "React (5 years)"), and the level is now one of the
 *    catalogue's words, estimated from the experience section when the CV does
 *    not state it. `willing-to-learn` is left out: a CV lists what someone has.
 *
 * The text below is duplicated rather than imported from `cv.constants.ts` on
 * purpose. A migration is a snapshot of one moment; importing the constant
 * would let a later edit silently change what this migration historically did.
 *
 * `variables: []` is hardcoded: the text has no `{{placeholders}}`.
 *
 * Idempotent: re-running is a no-op once the production version carries this
 * text, and it does nothing at all on a database whose prompts were never
 * seeded — there the seeder writes v1 from the updated constant instead.
 */

const NAME = "cv.extract.system";

const LABELS = ["latest", "production"];

const CONTENT = `You are a resume data parser. Fill the provided JSON schema using information found in the resume text. Return ONLY the filled JSON object.

Field-specific rules:
- jobTitles: List all job titles found in the experience section (e.g. "Software Engineer", "Frontend Developer").
- industries: Infer the industry/sector from the companies and roles (e.g. "Information Technology", "Finance", "Healthcare"). Use broad industry names.
- workModes: Look for any mention of remote, hybrid, or onsite/office work in the experience descriptions or anywhere in the resume. Return matching terms as-is (e.g. "Remote", "Hybrid", "Onsite"). Return empty array if no mention found.
- experienceLevels: Calculate total years of professional experience from the experience section (treat "Present" as today). Then classify using these rules: 0–1 year → "Fresher"; 1–3 years → "Intermediate"; 3–7 years → "Expert"; 7+ years → "Lead". Return a single-element array with the matching level name.
- summary: If the resume has a summary, profile, objective or "about me" section, use that text, lightly cleaned up. Otherwise write 2–3 sentences in the candidate's voice (first person) from facts the resume states: their roles, years of experience and main skills. Never invent employers, numbers or achievements. Leave it empty only if the resume has no experience, education or skills at all.
- skills.name: The skill's common name only, without levels or years (e.g. "React", not "React (5 years)").
- skills.proficiencyLevel: Exactly one of "beginner", "intermediate" or "advanced". If the resume states a level, map it: "expert" or "proficient" → "advanced"; "basic" or "familiar" → "beginner". Otherwise estimate it from the experience section: used in a main role for 3+ years → "advanced"; used regularly for 1–3 years → "intermediate"; only mentioned or used briefly → "beginner". If there is nothing to go on, use "intermediate".
- summary is the only field you may compose. Never add skills, interests, jobs or education the resume does not mention.
- Leave a field as an empty string or empty array if the data cannot be determined.`;

module.exports = {
  async up(db) {
    const prompts = db.collection("prompts");

    const newest = await prompts.find({ name: NAME }).sort({ version: -1 }).limit(1).next();

    // Never seeded. Creating v1 here would race the seeder for the same job, so
    // leave it to the seeder, which writes the updated constant anyway.
    if (!newest) return;

    // Already live — a re-run, or a fresh database seeded from the new constant.
    const live = await prompts.findOne({ name: NAME, labels: "production" });
    if (live && live.content === CONTENT) return;

    // The pull must precede the insert. `{name, labels}` is a unique multikey
    // index, so a label cannot exist on two versions even for an instant —
    // inserting first would fail with a duplicate key. Same ordering, and the
    // same reason, as `setLabel` in prompt.service.ts.
    await prompts.updateMany({ name: NAME, labels: { $in: LABELS } }, { $pull: { labels: { $in: LABELS } } });

    const now = new Date();

    await prompts.insertOne({
      name: NAME,
      version: newest.version + 1,
      content: CONTENT,
      variables: [],
      labels: LABELS,
      commitMessage: "Add summary and skill rules for the CV-to-profile import.",
      deleteMarker: { status: false, deletedAt: null, dateScheduled: null },
      // Set by hand: migrate-mongo talks to the raw driver, so no mongoose
      // timestamps run.
      createdAt: now,
      updatedAt: now,
      __v: 0,
    });
  },

  async down(db) {
    const prompts = db.collection("prompts");

    const versions = await prompts.find({ name: NAME }).sort({ version: -1 }).toArray();

    // `up` was a no-op: nothing seeded, or v1 already carried this text. There
    // is no version of ours to remove, and deleting the only one would destroy
    // the prompt.
    if (versions.length < 2 || versions[0].content !== CONTENT) return;

    const [inserted, previous] = versions;

    await prompts.deleteOne({ _id: inserted._id });
    await prompts.updateOne({ _id: previous._id }, { $addToSet: { labels: { $each: LABELS } } });
  },
};
