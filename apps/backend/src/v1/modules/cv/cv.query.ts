import { omit } from "lodash";
import { PipelineStage } from "mongoose";
import { eq, ListQuerySpec, projectQuery } from "../../../common/query";
import { ICVDoc, CV } from "../../../models";
import { CvAbilityBuilder, CvAuthZEntity } from "@rl/authz";
import { accessibleBy } from "@casl/mongoose";
import { AbilityAction, VISIBILITY_ENUM } from "@rl/types";
import { modelNames } from "../../../models/constants";

export const cvProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof ICVDoc | "__v")[] = ["__v"];

  const selectedFields = Object.keys(omit(CV.schema.paths, fieldsToExclude));
  selectedFields.push("status");
  selectedFields.push("resume");

  return projectQuery(selectedFields);
};

export const cvRoleScopedSecurityQuery = (ability: ReturnType<CvAbilityBuilder["getAbility"]>) => {
  const query = accessibleBy(ability, AbilityAction.Read).ofType(CvAuthZEntity);
  return query;
};

export const populateCvResumeQuery = (): PipelineStage[] => {
  const baseUrl = process.env.PUBLIC_MEDIA_BASE_URL || "";

  return [
    {
      $lookup: {
        from: modelNames.FILE_MEDIA,
        let: { resumeId: "$resumeId" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", "$$resumeId"] },
            },
          },
          {
            $addFields: {
              src: {
                $cond: {
                  if: { $eq: ["$visibility", VISIBILITY_ENUM.PUBLIC] },
                  then: { $concat: [baseUrl, "/", "$storageInformation.Key"] },
                  else: null,
                },
              },
            },
          },
          {
            $project: {
              deleteMarker: 0,
              __v: 0,
              collectionName: 0,
              collectionDocument: 0,
              createdAt: 0,
              updatedAt: 0,
            },
          },
        ],
        as: "resume",
      },
    },
    {
      $unwind: {
        path: "$resume",
        preserveNullAndEmptyArrays: true,
      },
    },
  ];
};

/**
 * `jobProfileId` is absent on purpose. A candidate's CASL rules also match any
 * published CV, so the security query alone does not keep this list to one
 * person — the controller pins the profile the access guard authorised. Making
 * it a filter here as well would just duplicate that pin.
 */
export const cvListQuerySpec: ListQuerySpec = {
  filters: { status: eq("status") },
  sortable: ["createdAt", "updatedAt", "title"],
  defaultSort: "-createdAt",
  // Kept from the old MongoQuery contract so no frontend call site has to change.
  searchKey: "clientSearch",
  searchFields: ["title", "summary", "skills"],
};
