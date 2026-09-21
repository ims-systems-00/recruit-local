import Joi from "joi";
import { AgentTool } from "./tool.types";
import { CATALOGS, SEARCHABLE_KINDS, SearchableKind, VALUE_TYPES, searchOptions } from "./catalog.shared";
import { isCandidate } from "./profile-write.shared";

/**
 * Looks up the options a candidate can pick during setup: job titles,
 * industries, experience levels, work modes and workplace values.
 *
 * Exists so nothing downstream ever has to guess an id. The model finds real
 * rows here, and both `set_profile_catalog` and catalog-backed page actions
 * re-check every id against the catalog before using it — a model that skips
 * this tool and invents an id is told so, and corrects itself.
 *
 * Catalog rows are shared reference data, identical for every candidate and
 * already served unfiltered to the onboarding screens, so there is no per-user
 * scoping to apply — the same position as `search_help`.
 */

const MAX_LIMIT = 20;
const DEFAULT_LIMIT = 10;

const pluralOf = (kind: SearchableKind) => (kind === "value" ? "workplace values" : CATALOGS[kind].pluralLabel);

export const searchCatalogTool: AgentTool<{
  kind: SearchableKind;
  query?: string;
  valueType?: string;
  limit?: number;
}> = {
  name: "search_catalog",
  description:
    "Search the lists a candidate picks from when setting up their profile: job titles, industries, experience levels, " +
    "work modes, and workplace values. Returns the options with their ids. " +
    "Call this before selecting or setting any option, every time, in this conversation — never pass an id you did not " +
    "get from this tool, and never guess an id from the pattern of other ids. " +
    "If more than one option could match what the user said, show them the options by name and ask which they mean — " +
    "unless they explicitly asked you to choose for them, in which case pick the best fits and say why. " +
    "If nothing matches (catalog names are general roles, so a technology like 'MERN' will not appear), " +
    "search again with a broader word such as 'developer' before asking the user. " +
    "Omit `query` to list everything, which suits short lists like work modes and experience levels. " +
    "Workplace values are grouped into types, one type per setup round: pass `valueType` for kind 'value'.",

  parameters: {
    type: "object",
    properties: {
      kind: { type: "string", enum: [...SEARCHABLE_KINDS], description: "Which list to search." },
      query: {
        type: "string",
        description: "A word or phrase from what the user said, e.g. 'nurse', 'health'. Omit to list all options.",
      },
      valueType: {
        type: "string",
        enum: VALUE_TYPES,
        description: "Required when kind is 'value': the value type of the round the user is on.",
      },
      limit: {
        type: "number",
        description: `How many options to return. Default ${DEFAULT_LIMIT}, maximum ${MAX_LIMIT}.`,
      },
    },
    required: ["kind"],
  },

  inputSchema: Joi.object({
    kind: Joi.string()
      .valid(...SEARCHABLE_KINDS)
      .required(),
    query: Joi.string().trim().max(100).allow(""),
    valueType: Joi.string()
      .valid(...VALUE_TYPES)
      .when("kind", {
        is: "value",
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      })
      .messages({ "any.required": "valueType is required when searching workplace values." }),
    limit: Joi.number().integer().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  }),

  mutating: false,

  isAvailable: isCandidate,

  async execute(input) {
    const options = await searchOptions(input.kind, {
      query: input.query,
      limit: input.limit ?? DEFAULT_LIMIT,
      valueType: input.valueType,
    });

    return {
      kind: input.kind,
      ...(input.valueType ? { valueType: input.valueType } : {}),
      options,
      returned: options.length,
      ...(input.kind === "value" ? {} : { selectionLimit: CATALOGS[input.kind].max }),
      ...(options.length === 0
        ? { note: `No ${pluralOf(input.kind)} match that. Try a broader word, or omit the query to list them all.` }
        : {}),
    };
  },
};
