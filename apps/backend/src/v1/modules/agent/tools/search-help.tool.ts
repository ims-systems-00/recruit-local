import Joi from "joi";
import { ACCOUNT_TYPE_ENUMS, HELP_ARTICLE_AUDIENCE, HELP_ARTICLE_TOPIC, HelpArticleDto } from "@rl/types";
import { HelpArticle } from "../../../../models";
import { truncate } from "../context";
import { AgentTool, AgentToolContext } from "./tool.types";

/**
 * Product documentation lookup.
 *
 * A deliberate exception to the CASL contract in `tool.types.ts`, and the only
 * one: help articles are platform documentation, not records. Every reader of a
 * given audience sees byte-identical text, no article is derived from anyone's
 * data, and there is no entity to build an ability against. The audience filter
 * below is an editorial concern — showing an employer a candidate's walkthrough
 * is unhelpful, not a disclosure.
 *
 * The rule the contract is actually protecting still holds: this tool reads one
 * collection, that collection holds only seeded text, and nothing user-owned is
 * reachable from it. A tool added later that reads anything else does not get
 * to cite this one as precedent.
 */

/** Enough for the model to quote an answer; short enough that three fit in context. */
const BODY_MAX_CHARS = 1_800;

const MAX_LIMIT = 5;
const DEFAULT_LIMIT = 3;

/**
 * Which articles this caller may usefully be shown.
 *
 * A user part-way through setup has no account type yet, and that is the case
 * this tool exists for — they get the shared articles, which is where "how do I
 * choose an account type" lives. Not an error state.
 */
const audiencesFor = (type?: string | null): HELP_ARTICLE_AUDIENCE[] => {
  const shared = [HELP_ARTICLE_AUDIENCE.EVERYONE];

  if (type === ACCOUNT_TYPE_ENUMS.CANDIDATE) return [...shared, HELP_ARTICLE_AUDIENCE.CANDIDATE];
  if (type === ACCOUNT_TYPE_ENUMS.EMPLOYER) return [...shared, HELP_ARTICLE_AUDIENCE.EMPLOYER];

  // Platform admins and not-yet-onboarded users both land here. An admin
  // answering a support question wants to see every side of the product.
  if (type === ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) return Object.values(HELP_ARTICLE_AUDIENCE);

  return shared;
};

const toDto = (doc: {
  slug: string;
  title: string;
  topic: HELP_ARTICLE_TOPIC;
  audience: HELP_ARTICLE_AUDIENCE;
  summary: string;
  body: string;
}): HelpArticleDto => ({
  slug: doc.slug,
  title: doc.title,
  topic: doc.topic,
  audience: doc.audience,
  summary: doc.summary,
  body: truncate(doc.body, BODY_MAX_CHARS),
});

/**
 * Ranked full-text search, with a topic listing as the fallback.
 *
 * Two passes rather than one because `$text` matches whole words only: a user
 * typing "verif" or "onboard" scores zero against an index that holds "verified"
 * and "onboarding". The regex pass catches those, and running it only when the
 * text pass came back empty keeps the common case on the index.
 */
const search = async (query: string, audiences: HELP_ARTICLE_AUDIENCE[], limit: number) => {
  const audienceFilter = { audience: { $in: audiences } };

  const scored = await HelpArticle.find(
    { $and: [audienceFilter, { $text: { $search: query } }] },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .limit(limit)
    .lean();

  if (scored.length > 0) return scored;

  // Escaped before it reaches a RegExp: the string is model-supplied, and an
  // unescaped `(` is a thrown exception rather than a bad result.
  const safe = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!safe) return [];

  const pattern = new RegExp(safe, "i");

  return HelpArticle.find({
    $and: [audienceFilter, { $or: [{ title: pattern }, { keywords: pattern }, { summary: pattern }] }],
  })
    .limit(limit)
    .lean();
};

export const searchHelpTool: AgentTool<{ query?: string; topic?: HELP_ARTICLE_TOPIC; limit?: number }> = {
  name: "search_help",
  description:
    "Search Recruit Local's help documentation for how the platform works. " +
    "Use this for any question about what a feature does, how something is scored or calculated, what a status means, " +
    "what the setup steps are, or what the user is able to do on the platform — including questions about you, the assistant. " +
    "Prefer this over answering from memory: it returns what the platform actually does today. " +
    "Pass `topic` instead of `query` to pull everything on a subject when the question is broad, such as 'how do I get started'.",

  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "What the user wants to know, in their own words or as keywords. Prefer the user's own phrasing over a rewrite.",
      },
      topic: {
        type: "string",
        enum: Object.values(HELP_ARTICLE_TOPIC),
        description: "Return every article in this topic. Use for broad questions, or alongside `query` to narrow it.",
      },
      limit: {
        type: "number",
        description: `How many articles to return. Default ${DEFAULT_LIMIT}, maximum ${MAX_LIMIT}.`,
      },
    },
    required: [],
  },

  inputSchema: Joi.object({
    query: Joi.string().trim().min(2).max(300),
    topic: Joi.string().valid(...Object.values(HELP_ARTICLE_TOPIC)),
    limit: Joi.number().integer().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  })
    // At least one, or the tool is a request to dump the entire corpus into
    // context — which is the one thing putting it in a database was meant to avoid.
    .or("query", "topic")
    .unknown(true),

  mutating: false,

  async execute(input, ctx: AgentToolContext) {
    const limit = input.limit ?? DEFAULT_LIMIT;
    const audiences = audiencesFor(ctx.session.user?.type);

    const docs = input.query
      ? await search(input.query, audiences, limit)
      : await HelpArticle.find({ audience: { $in: audiences }, topic: input.topic })
          .limit(limit)
          .lean();

    const articles = docs.map(toDto);

    return {
      articles,
      returned: articles.length,
      ...(articles.length === 0
        ? {
            note: "No help article covers this. Say you do not have documentation on it rather than answering from general knowledge about recruitment software.",
          }
        : {}),
    };
  },
};
