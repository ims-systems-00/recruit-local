/**
 * Gives the application match score its own field.
 *
 * The score used to be written straight into `rank`, which is the kanban
 * ordering field owned by the boardable plugin. That field is rewritten by
 * `moveToPosition` on every drag and by `rebalanceColumn` on every rebalance, so
 * a score stored there was destroyed the first time a recruiter moved the card.
 * `matchScore` is now the durable copy; `rank` is still seeded to the same
 * number by the ranking queue so a board opens best-match-first, and is then
 * free to diverge.
 *
 * Backfill: `rank` is the only estimate available for existing rows, and it is
 * only trustworthy inside the ranking domain [0, RANKING_SCALE]. A rebalanced
 * column produces 1000, 2000, 3000, ... so anything above the scale is provably
 * board order, not a score, and backfills to 0. A rank of exactly 1000 is
 * genuinely ambiguous — a perfect score and a rebalanced top card are
 * indistinguishable — and is taken at face value. Rows that land on 0 stay
 * there: nothing re-ranks after create, so they need a re-rank pass to get a
 * real number.
 *
 * Also adds the index backing best-match-first reads over one job. Dev builds it
 * via mongoose autoIndex; this covers existing/prod data. Idempotent —
 * createIndex is a no-op when the index already exists, and the update is
 * filtered on the field being absent.
 */
const RANKING_SCALE = 1000;

module.exports = {
  async up(db) {
    await db.collection("applications").updateMany({ matchScore: { $exists: false } }, [
      {
        $set: {
          matchScore: {
            $cond: [
              {
                $and: [{ $isNumber: "$rank" }, { $gte: ["$rank", 0] }, { $lte: ["$rank", RANKING_SCALE] }],
              },
              { $round: ["$rank", 0] },
              0,
            ],
          },
        },
      },
    ]);

    await db.collection("applications").createIndex({ jobId: 1, matchScore: -1 });
  },

  async down(db) {
    await db.collection("applications").dropIndex({ jobId: 1, matchScore: -1 });
    await db.collection("applications").updateMany({}, { $unset: { matchScore: "" } });
  },
};
