import { omit } from "lodash";
import { PipelineStage } from "mongoose";
import { accessibleBy } from "@casl/mongoose";
import { AbilityAction } from "@rl/types";
import { TrainingAbilityBuilder, TrainingAuthZEntity } from "@rl/authz";
import { dateRange, eq, ListQuerySpec, populateFileMediaQuery, projectQuery } from "../../../common/query";
import { ITrainingDoc, Training } from "../../../models";
import { modelNames } from "../../../models/constants";

export const trainingProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof ITrainingDoc | "__v")[] = ["__v"];

  const selectedFields = Object.keys(omit(Training.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};

/** Adds the certificate file, with its public `src` URL, as `certificate`. */
export const populateTrainingCertificateQuery = (): PipelineStage[] =>
  populateFileMediaQuery("certificateId", "certificate");

/**
 * Replaces `skills` (catalogue ids) with `{ _id, name }` entries, in the order
 * they were picked — a `$lookup` alone does not keep it.
 *
 * Deactivated and soft-deleted entries still resolve, as they do for a job's or
 * a profile's skills: the entry was valid when the training was saved. Only an
 * entry that is gone outright (hard-deleted) drops out.
 */
export const populateTrainingSkillsQuery = (): PipelineStage[] => [
  {
    $lookup: {
      from: modelNames.SKILL_CATALOG,
      localField: "skills",
      foreignField: "_id",
      pipeline: [{ $project: { name: 1 } }],
      as: "_skillEntries",
    },
  },
  {
    $addFields: {
      skills: {
        $filter: {
          input: {
            $map: {
              input: { $cond: [{ $isArray: "$skills" }, "$skills", []] },
              as: "id",
              in: {
                $first: {
                  $filter: { input: "$_skillEntries", as: "entry", cond: { $eq: ["$$entry._id", "$$id"] } },
                },
              },
            },
          },
          as: "entry",
          cond: { $eq: [{ $type: "$$entry" }, "object"] },
        },
      },
    },
  },
  { $project: { _skillEntries: 0 } },
];

export const trainingRoleScopedSecurityQuery = (ability: ReturnType<TrainingAbilityBuilder["getAbility"]>) => {
  const query = accessibleBy(ability, AbilityAction.Read).ofType(TrainingAuthZEntity);
  return query;
};

/**
 * `jobProfileId` is a filter, not the security boundary — `trainingRoleScopedSecurityQuery`
 * is, and `assertProfileScopedListAccess` gates whose profile may be asked for.
 * Anything not listed here never reaches `$match`.
 */
export const trainingListQuerySpec: ListQuerySpec = {
  filters: {
    jobProfileId: eq("jobProfileId"),
    organizationName: eq("organizationName"),
    startDate: dateRange("startDate"),
  },
  sortable: ["createdAt", "startDate", "endDate"],
  defaultSort: "-startDate",
  searchKey: "clientSearch",
  // Not `skills`: those are catalogue ids, which a text search cannot match.
  searchFields: ["courseName", "organizationName"],
};
