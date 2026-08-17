/* eslint-disable @typescript-eslint/no-explicit-any */
import Joi from "joi";
import { ISession } from "@rl/types";
import { analyseJobProfile } from "../../job-profile/profile-analysis.service";
import { AgentTool, AgentToolContext } from "./tool.types";
import { readMyJobProfile } from "./tool.shared";

/**
 * Diagnoses the caller's own candidate profile.
 *
 * Deliberately not a judgement the model makes for itself. Every finding comes
 * from a rule in `profile-analysis.service.ts` that names a mechanism actually
 * present in this codebase — a ranking matcher that will report itself
 * inapplicable, the CASL condition that hides an unverified profile from
 * employers, the keyword overlap that recommendations are computed from. That
 * makes the answer the same every time it is asked, and makes each piece of
 * advice defensible rather than plausible.
 *
 * The model's job is to relay and prioritise; the numbers and the reasons are
 * already decided.
 */
export const analyzeMyProfileTool: AgentTool<Record<string, never>> = {
  name: "analyze_my_profile",
  description:
    "Analyse the current user's own candidate profile and report what is wrong with it. " +
    "Returns the profile's completion percentage, the sections still unfinished, and a list of specific issues " +
    "ordered most serious first — each with the problem, how to fix it, and what it is costing them. " +
    "Use this for any question about how good their profile is, what is missing, why they are not getting matches or " +
    "interest, or what they should improve next. " +
    "The issues are computed by the platform, not inferred from the profile text: report them as given, keep the " +
    "order, and do not invent additional problems or soften the ones returned. An `impact` explains why an issue " +
    "matters — use it, because it is the part that tells the user what fixing it will actually get them. " +
    "An empty `issues` list with `healthy` true means the profile has no known problems; say so rather than " +
    "searching for something to criticise.",

  parameters: {
    type: "object",
    properties: {},
    required: [],
  },

  // Deliberately lenient, as get_my_profile is. The tool takes no input, so
  // there is no trust boundary to defend, and rejecting a stray key the model
  // invented would burn a retry to no purpose.
  inputSchema: Joi.object({}).unknown(true),

  mutating: false,

  /**
   * Offered only to accounts that have a candidate profile — there is nothing
   * for this to analyse otherwise. Not the security boundary: `readMyJobProfile`
   * rebuilds the ability and checks the row regardless.
   */
  isAvailable: (session: ISession) => Boolean(session.jobProfileId),

  async execute(_input, ctx: AgentToolContext) {
    const profile = await readMyJobProfile(ctx.session);

    return analyseJobProfile(profile as Record<string, any>);
  },
};
