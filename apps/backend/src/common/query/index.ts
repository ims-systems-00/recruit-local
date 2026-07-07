import { Model, PipelineStage } from "mongoose";
import { accessibleBy } from "@casl/mongoose";
import { AnyMongoAbility } from "@casl/ability";
import { VISIBILITY_ENUM } from "@rl/types";
import { AbilityAction } from "../../types/ability";
import { modelNames } from "../../models/constants";

type Constructor<T> = new (...args: any[]) => T;

export const roleScopedSecurityQuery = <T>(entity: Constructor<T>, ability: AnyMongoAbility) => {
  const query = accessibleBy(ability, AbilityAction.Read).ofType(entity);
  return query;
};

export const matchQuery = (query: any): PipelineStage[] => {
  return [{ $match: { ...query } }];
};

export const projectQuery = (fields: string[]): PipelineStage[] => {
  const projection: Record<string, number> = {};
  fields.forEach((field) => {
    projection[field] = 1;
  });

  return [{ $project: projection }];
};

export const excludeDeletedQuery = (): PipelineStage[] => {
  return [
    {
      $match: {
        "deleteMarker.status": {
          $ne: true,
        },
      },
    },
  ];
};

export const onlyDeletedQuery = (): PipelineStage[] => {
  return [
    {
      $match: {
        "deleteMarker.status": true,
      },
    },
  ];
};

/**
 * Reusable $lookup that replaces a parent document's array of ObjectIds (`field`)
 * with the populated, non-soft-deleted catalog documents from `model`. Mirrors
 * `populateValuesQuery` but is generic over any catalog model (JobTitle,
 * Industry, WorkMode, ...), projecting all of the target's schema fields except
 * `__v`.
 */
export const populateNamedRefQuery = <T>(model: Model<T>, field: string): PipelineStage[] => {
  const selectedFields = Object.keys(model.schema.paths).filter((path) => path !== "__v");
  return [
    {
      $lookup: {
        from: model.collection.name,
        localField: field,
        foreignField: "_id",
        as: field,
        pipeline: [...excludeDeletedQuery(), ...projectQuery(selectedFields)] as PipelineStage.Lookup["$lookup"]["pipeline"],
      },
    },
  ];
};

/**
 * Single-reference variant of `populateNamedRefQuery`: replaces a parent's
 * scalar ObjectId (`field`) with the one populated catalog document (or `null`
 * when the ref is missing / soft-deleted), flattening the `$lookup` array.
 */
export const populateSingleNamedRefQuery = <T>(model: Model<T>, field: string): PipelineStage[] => [
  ...populateNamedRefQuery(model, field),
  { $addFields: { [field]: { $ifNull: [{ $arrayElemAt: [`$${field}`, 0] }, null] } } },
];

/**
 * Reusable single-FileMedia populate: replaces a parent's scalar ObjectId
 * (`lookupField`) with the referenced FileMedia document exposed under `asField`,
 * adding a public `src` URL (only for PUBLIC visibility) and stripping internal
 * fields. Flattens the `$lookup` array via `$unwind` while preserving documents
 * whose reference is missing/null. Mirrors the KYC document populate pattern.
 */
export const populateFileMediaQuery = (lookupField: string, asField: string): PipelineStage[] => {
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

export const populateStatusQuery = (): PipelineStage[] => {
  return [
    {
      $lookup: {
        from: "statuses",
        localField: "statusId",
        foreignField: "_id",
        as: "status",
      },
    },
    {
      $unwind: {
        path: "$status",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        status: { $ifNull: ["$status.label", "unknown"] },
      },
    },
    {
      $project: {
        statusLabel: 0,
      },
    },
  ];
};
