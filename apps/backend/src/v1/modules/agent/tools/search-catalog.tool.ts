import Joi from "joi";
import { AgentTool } from "./tool.types";
import { CATALOG_KINDS, CATALOGS, CatalogKind, escapeRegExp, selectableFilter } from "./catalog.shared";
import { isCandidate } from "./profile-write.shared";

/**
 * Looks up the options a candidate can pick during personalisation.
 *
 * Exists so `set_profile_catalog` never has to guess. The model finds real rows
 * here, shows them to the user, and passes on the ids the user chose — the
 * alternative, letting the set tool match a name itself, is how "Nurse" quietly
 * becomes "Nurse Practitioner".
 *
 * Catalog rows are shared reference data, identical for every candidate and
 * already served unfiltered to the onboarding screens, so there is no per-user
 * scoping to apply — the same position as `search_help`.
 */

const MAX_LIMIT = 10;
const DEFAULT_LIMIT = 8;

export const searchCatalogTool: AgentTool<{ kind: CatalogKind; query?: string; limit?: number }> = {
  name: "search_catalog",
  description:
    "Search the lists a candidate picks from when setting up their profile: job titles, industries, experience levels " +
    "and work modes. Returns the matching options with their ids. " +
    "Use this before set_profile_catalog, every time — never pass an id you did not get from here. " +
    "If more than one option could match what the user said, show them the options by name and ask which they mean — " +
    "unless they explicitly asked you to choose for them, in which case pick the best fits and say why. " +
    "If nothing matches (catalog names are general roles, so a technology like 'MERN' will not appear), " +
    "search again with a broader word such as 'developer' before asking the user. " +
    "Omit `query` to list everything, which is sensible for short lists like work modes and experience levels.",

  parameters: {
    type: "object",
    properties: {
      kind: {
        type: "string",
        enum: [...CATALOG_KINDS],
        description: "Which list to search.",
      },
      query: {
        type: "string",
        description: "A word or phrase from what the user said, e.g. 'nurse', 'health'. Omit to list all options.",
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
      .valid(...CATALOG_KINDS)
      .required(),
    query: Joi.string().trim().max(100).allow(""),
    limit: Joi.number().integer().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  }),

  mutating: false,

  isAvailable: isCandidate,

  async execute(input) {
    const config = CATALOGS[input.kind];
    const query = input.query?.trim();
    const limit = input.limit ?? DEFAULT_LIMIT;

    // Same fields the onboarding screen's search box matches on.
    const match = query
      ? {
          ...selectableFilter,
          $or: [{ name: new RegExp(escapeRegExp(query), "i") }, { description: new RegExp(escapeRegExp(query), "i") }],
        }
      : selectableFilter;

    const docs = (await config.model
      .find(match)
      .select("name description")
      .sort({ name: 1 })
      .limit(limit)
      .lean()) as unknown as {
      _id: unknown;
      name: string;
      description?: string;
    }[];

    const options = docs.map((doc) => ({
      id: String(doc._id),
      name: doc.name,
      ...(doc.description ? { description: doc.description } : {}),
    }));

    return {
      kind: input.kind,
      options,
      returned: options.length,
      selectionLimit: config.max,
      ...(options.length === 0
        ? { note: `No ${config.pluralLabel} match that. Ask the user for a different or broader word.` }
        : {}),
    };
  },
};
