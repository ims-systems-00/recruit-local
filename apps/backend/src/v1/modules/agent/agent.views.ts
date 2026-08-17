/* eslint-disable @typescript-eslint/no-explicit-any */
import { AGENT_VIEW_TYPE, AgentViewDto } from "@rl/types";
import { logger } from "../../../common/helper";

/**
 * Turns a tool result into something the client can render as components.
 *
 * The model answers in prose, and prose is where fetched values get retyped —
 * which is how a bare `currentSalary: 25000` becomes "25,000 BDT" in an answer
 * when no currency exists anywhere in the schema. A view hands the client the
 * tool's own rows, so what is displayed is what was read.
 *
 * Rows arrive here already sanitized against the caller's ability, so this file
 * only decides *which* results are renderable and how they are labelled. It
 * must never widen a result: no lookups, no defaults, no filling an absent field
 * with null. A key the caller may not read is missing on purpose.
 */

/**
 * A whitelist rather than a passthrough. An unlisted tool produces no view,
 * so a tool added later ships prose-only until someone decides what its result
 * looks like on screen — the safe default is the one that happens by omission.
 */
const VIEWS: Record<string, (result: Record<string, any>) => AgentViewDto | null> = {
  list_applications: (result) => listView(AGENT_VIEW_TYPE.APPLICATION_LIST, result.applications, result),
  list_jobs: (result) => listView(AGENT_VIEW_TYPE.JOB_LIST, result.jobs, result),
  recommend_jobs: (result) => listView(AGENT_VIEW_TYPE.JOB_LIST, result.jobs, result),
  // Returns the application itself rather than a wrapper, so the row *is* the
  // result. Kept as a one-item list so clients have a single shape to render.
  get_application: (result) =>
    result._id != null ? { type: AGENT_VIEW_TYPE.APPLICATION_DETAIL, items: [result] } : null,
};

/**
 * Second cap behind each tool's own `MAX_LIMIT`. The tools bound their own page
 * size today; this is what keeps that true if one of them is later loosened,
 * since the response size stops being anyone's explicit concern once views work.
 */
const MAX_VIEW_ITEMS = 25;

/**
 * The heading a client puts above the block. Taken from the rows rather than
 * from the model's arguments — the model asked for a `jobId`, the rows know the
 * job's actual title, and only one of those is worth showing a user.
 *
 * Only when every row agrees: a list spanning three jobs has no single title,
 * and picking the first row's would mislabel the other two.
 */
const titleOf = (type: AGENT_VIEW_TYPE, items: Record<string, any>[]): string | undefined => {
  if (type !== AGENT_VIEW_TYPE.APPLICATION_LIST || items.length === 0) return undefined;

  const titles = new Set(items.map((item) => item.jobTitle).filter(Boolean));
  return titles.size === 1 ? `Applicants for ${[...titles][0]}` : undefined;
};

const listView = (type: AGENT_VIEW_TYPE, rows: unknown, result: Record<string, any>): AgentViewDto | null => {
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const items = rows.slice(0, MAX_VIEW_ITEMS);
  const title = titleOf(type, items);

  return {
    type,
    ...(title ? { title } : {}),
    // `returned` is recomputed from what survived the slice rather than copied
    // from the tool, so it can never disagree with `items.length`.
    ...(typeof result.totalMatching === "number" ? { totalMatching: result.totalMatching } : {}),
    returned: items.length,
    items,
  };
};

/**
 * Never throws. A view is presentation layered onto a run that already
 * succeeded, so a shape this file did not expect must cost the user their
 * table, not their answer.
 */
export const toView = (toolName: string, result: unknown): AgentViewDto | null => {
  const build = VIEWS[toolName];
  if (!build || result == null || typeof result !== "object") return null;

  try {
    return build(result as Record<string, any>);
  } catch (error) {
    logger.warn("[agent] could not build a view from a tool result", {
      tool: toolName,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};
