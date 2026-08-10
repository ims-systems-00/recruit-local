import { PipelineStage } from "mongoose";
import { omit } from "lodash";
import { accessibleBy } from "@casl/mongoose";
import { AbilityAction } from "@rl/types";
import { PromptAbilityBuilder, PromptAuthZEntity } from "@rl/authz";
import { projectQuery, excludeDeletedQuery } from "../../../common/query";
import { IPromptDoc, Prompt } from "../../../models";

export const promptRoleScopedSecurityQuery = (ability: ReturnType<PromptAbilityBuilder["getAbility"]>) => {
  const query = accessibleBy(ability, AbilityAction.Read).ofType(PromptAuthZEntity);
  return query;
};

export const promptProjectionQuery = (allowedFields?: string[]): PipelineStage[] => {
  let selectedFields: string[] = [];

  if (allowedFields && allowedFields.length > 0) {
    selectedFields = [...allowedFields];
  } else {
    const fieldsToExclude: (keyof IPromptDoc | "__v")[] = ["__v"];
    selectedFields = Object.keys(omit(Prompt.schema.paths, fieldsToExclude));
  }

  return projectQuery(selectedFields);
};

/**
 * Collapses the version rows into one row per prompt name — the registry view.
 *
 * `labels` comes back as a `{ label: version }` map rather than a list, because
 * the question this view answers is "where does production point", not "which
 * labels exist somewhere". Built with `$arrayToObject` over the per-version
 * label arrays; the unique `{ name, labels }` index guarantees each key appears
 * once, so no reduction is needed on collision.
 */
export const promptNameSummaryQuery = (): PipelineStage[] => [
  ...excludeDeletedQuery(),
  { $sort: { name: 1, version: 1 } },
  {
    $group: {
      _id: "$name",
      latestVersion: { $max: "$version" },
      versionCount: { $sum: 1 },
      updatedAt: { $max: "$updatedAt" },
      labelPairs: {
        $push: {
          $map: {
            input: { $ifNull: ["$labels", []] },
            as: "label",
            in: { k: "$$label", v: "$version" },
          },
        },
      },
    },
  },
  {
    $project: {
      _id: 0,
      name: "$_id",
      latestVersion: 1,
      versionCount: 1,
      updatedAt: 1,
      labels: {
        $arrayToObject: {
          $reduce: {
            input: "$labelPairs",
            initialValue: [],
            in: { $concatArrays: ["$$value", "$$this"] },
          },
        },
      },
    },
  },
  { $sort: { name: 1 } },
];
