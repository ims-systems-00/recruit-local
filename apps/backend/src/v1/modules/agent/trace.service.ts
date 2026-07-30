import { PipelineStage } from "mongoose";
import { AgentTraceStatsDto } from "@rl/types";
import { AgentTrace } from "../../../models";
import { IRecordTraceParams, ITraceStatsParams } from "./agent.interface";

/**
 * Writes one run's trace.
 *
 * Deliberately not part of any transaction. A trace is an observation of a run,
 * not a part of it — enlisting it would let a telemetry failure roll back real
 * work, which is exactly backwards.
 */
export const record = async (input: IRecordTraceParams) => {
  return AgentTrace.create(input);
};

/**
 * Everything the "which tools should I improve" question needs, in one round
 * trip: a per-tool rollup, a run-level rollup, and the stop-reason spread.
 *
 * `$facet` rather than three calls so all three views are computed from exactly
 * the same matched set — otherwise a run landing mid-query would make the
 * numbers disagree with each other.
 */
export const toolStats = async ({ from, to }: ITraceStatsParams): Promise<AgentTraceStatsDto> => {
  const match: Record<string, unknown> = {};
  if (from || to) {
    match.createdAt = {
      ...(from ? { $gte: from } : {}),
      ...(to ? { $lte: to } : {}),
    };
  }

  // Percentiles matter more than the mean here: one pathological call is what a
  // user actually notices, and it barely moves an average.
  //
  // `$percentile` is a Mongo 7 accumulator (docker-compose.dev.yml pins mongo:7)
  // but the driver's TypeScript types predate it, so this one stage is asserted
  // rather than type-checked. The rest of the pipeline stays checked.
  const toolDurationGroupStage = {
    $group: {
      _id: "$toolTrace.tool",
      calls: { $sum: 1 },
      failures: { $sum: { $cond: ["$toolTrace.ok", 0, 1] } },
      totalDurationMs: { $sum: "$toolTrace.durationMs" },
      avgDurationMs: { $avg: "$toolTrace.durationMs" },
      maxDurationMs: { $max: "$toolTrace.durationMs" },
      percentiles: {
        $percentile: { input: "$toolTrace.durationMs", p: [0.5, 0.95], method: "approximate" },
      },
    },
  } as unknown as PipelineStage.FacetPipelineStage;

  const pipeline: PipelineStage[] = [
    { $match: match },
    {
      $facet: {
        tools: [
          // One row per tool call, so a run that called the same tool three
          // times counts three times — call frequency is the point.
          { $unwind: "$toolTrace" },
          toolDurationGroupStage,
          {
            $project: {
              _id: 0,
              tool: "$_id",
              calls: 1,
              failures: 1,
              totalDurationMs: 1,
              avgDurationMs: { $round: ["$avgDurationMs", 0] },
              maxDurationMs: 1,
              p50DurationMs: { $round: [{ $arrayElemAt: ["$percentiles", 0] }, 0] },
              p95DurationMs: { $round: [{ $arrayElemAt: ["$percentiles", 1] }, 0] },
            },
          },
          { $sort: { calls: -1, tool: 1 } },
        ],
        runs: [
          {
            $group: {
              _id: null,
              runs: { $sum: 1 },
              failedRuns: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
              avgTotalDurationMs: { $avg: "$totalDurationMs" },
              avgStepsPerRun: { $avg: "$steps" },
              toolCalls: { $sum: "$toolCallCount" },
              llmCalls: { $sum: "$llmCallCount" },
              totalToolDurationMs: { $sum: "$toolDurationMs" },
              totalLlmDurationMs: { $sum: "$llmDurationMs" },
              totalTokens: { $sum: { $ifNull: ["$usage.totalTokens", 0] } },
            },
          },
          {
            $project: {
              _id: 0,
              runs: 1,
              failedRuns: 1,
              avgTotalDurationMs: { $round: ["$avgTotalDurationMs", 0] },
              avgStepsPerRun: { $round: ["$avgStepsPerRun", 2] },
              toolCalls: 1,
              llmCalls: 1,
              totalToolDurationMs: 1,
              totalLlmDurationMs: 1,
              totalTokens: 1,
            },
          },
        ],
        stoppedReasons: [
          { $group: { _id: "$stoppedReason", count: { $sum: 1 } } },
          { $project: { _id: 0, stoppedReason: "$_id", count: 1 } },
          { $sort: { count: -1 } },
        ],
      },
    },
  ];

  const [result] = await AgentTrace.aggregate(pipeline);

  // $facet returns empty arrays rather than zeros when nothing matched, so the
  // run rollup is defaulted here instead of leaving the caller to guess.
  const emptyRuns = {
    runs: 0,
    failedRuns: 0,
    avgTotalDurationMs: 0,
    avgStepsPerRun: 0,
    toolCalls: 0,
    llmCalls: 0,
    totalToolDurationMs: 0,
    totalLlmDurationMs: 0,
    totalTokens: 0,
  };

  return {
    from: from ? from.toISOString() : null,
    to: to ? to.toISOString() : null,
    runs: result?.runs?.[0] ?? emptyRuns,
    tools: result?.tools ?? [],
    stoppedReasons: result?.stoppedReasons ?? [],
  };
};
