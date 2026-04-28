import { PipelineStage } from "mongoose";
import { accessibleBy } from "@casl/mongoose";
import { omit } from "lodash";
import { VISIBILITY_ENUM } from "@rl/types";
import { projectQuery } from "../../../common/query";
import { IKycDoc, Kyc } from "../../../models";
import { KycAbilityBuilder, KycAuthZEntity } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import { modelNames } from "../../../models/constants";

const populateKycDocumentQuery = (lookupField: string, asField: string): PipelineStage[] => {
  const baseUrl = process.env.PUBLIC_MEDIA_BASE_URL || "";

  return [
    {
      $lookup: {
        from: modelNames.FILE_MEDIA,
        let: { documentId: `$${lookupField}` },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", "$$documentId"] },
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
        as: asField,
      },
    },
    {
      $unwind: {
        path: `$${asField}`,
        preserveNullAndEmptyArrays: true,
      },
    },
  ];
};

export const kycRoleScopedSecurityQuery = (ability: ReturnType<KycAbilityBuilder["getAbility"]>) => {
  return accessibleBy(ability, AbilityAction.Read).ofType(KycAuthZEntity);
};

export const kycProjectionQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IKycDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(Kyc.schema.paths, fieldsToExclude));
  selectedFields.push("documentFront");
  selectedFields.push("documentBack");
  return projectQuery(selectedFields);
};

export const populateKycDocumentsQuery = (): PipelineStage[] => {
  return [
    ...populateKycDocumentQuery("documentFrontId", "documentFront"),
    ...populateKycDocumentQuery("documentBackId", "documentBack"),
  ];
};
