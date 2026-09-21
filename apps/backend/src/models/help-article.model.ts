import { Schema, model, Model } from "mongoose";
import { HELP_ARTICLE_AUDIENCE, HELP_ARTICLE_TOPIC } from "@rl/types";
import { modelNames } from "./constants";
import { IBaseDoc } from "./interfaces/base.interface";

/**
 * A single piece of product documentation the agent can quote.
 *
 * Stored in Mongo rather than compiled into the system prompt so the corpus can
 * grow past what is affordable to send on every turn, and so a wording fix is a
 * reseed rather than a deploy — the same reasoning that put the prompts in a
 * registry.
 *
 * No soft-delete plugin and no tenant plugin, deliberately. An article belongs
 * to the platform, not to a tenant, and retiring one means removing it from the
 * seed: keeping a tombstone of documentation nobody should read has no audience.
 */

export interface HelpArticleInput {
  /** Stable address, and the seeder's idempotency key. */
  slug: string;
  title: string;
  topic: HELP_ARTICLE_TOPIC;
  audience: HELP_ARTICLE_AUDIENCE;
  /** One or two sentences. What the agent uses when several articles match. */
  summary: string;
  /** The full answer, in markdown. */
  body: string;
  /**
   * Words a user would plausibly type that do not appear in the prose — "CV"
   * on an article that says "resume" throughout, product names, abbreviations.
   * Weighted highest in the text index, since an author adding one here is
   * making a deliberate claim about phrasing.
   */
  keywords?: string[];
}

export interface IHelpArticleDoc extends HelpArticleInput, IBaseDoc {}

type IHelpArticleModel = Model<IHelpArticleDoc>;

const helpArticleSchema = new Schema<IHelpArticleDoc>(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    topic: { type: String, enum: Object.values(HELP_ARTICLE_TOPIC), required: true },
    audience: {
      type: String,
      enum: Object.values(HELP_ARTICLE_AUDIENCE),
      default: HELP_ARTICLE_AUDIENCE.EVERYONE,
      index: true,
    },
    summary: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    keywords: { type: [String], default: [] },
  },
  { timestamps: true }
);

/**
 * The index the search tool runs on.
 *
 * Weighted rather than flat: a user asking "kyc" wants the article *about* KYC,
 * not the six that mention it in passing. Title outranks keywords so an exact
 * title match always wins, and body is weighted down to 1 because a long
 * article would otherwise beat a short, precise one purely on term frequency.
 *
 * Mongo permits only one text index per collection, which is why all four
 * fields are folded into this one rather than indexed separately.
 */
helpArticleSchema.index(
  { title: "text", keywords: "text", summary: "text", body: "text" },
  { weights: { title: 10, keywords: 8, summary: 4, body: 1 }, name: "help_article_text" }
);

export const HelpArticle = model<IHelpArticleDoc, IHelpArticleModel>(modelNames.HELP_ARTICLE, helpArticleSchema);
