import mongoose, { PipelineStage } from "mongoose";

export const getProcessingAggregatorQuery = (): PipelineStage[] => [
  {
    $project: {
      _id: 1,
      fullName: 1,
      type: 1,
      email: 1,
      voIPNumber: 1,
      createdAt: 1,
      updatedAt: 1,
      profileImageSrc: 1,
      tenantId: 1,
      isConsultant: 1,
      isPrimaryUser: 1,
      role: 1,
    },
  },
];

export const getMatchAggregatorQuery = (query: any): PipelineStage[] => [
  {
    $match: {
      ...query,
      "deleteMarker.status": false,
    },
  },
];

export const getMatchAggregatorQueryForList = (query: any): PipelineStage[] => [
  {
    $match: {
      ...query,
      "deleteMarker.status": false,
    },
  },
];

export const getAuditAggregatorQueryForList = (): PipelineStage[] => [
  {
    $lookup: {
      from: "audits",
      localField: "_id",
      foreignField: "tenantId",
      as: "audits",
    },
  },
  {
    $addFields: {
      auditsCount: {
        $cond: {
          if: { $isArray: "$audits" },
          then: { $size: "$audits" },
          else: 0,
        },
      },
    },
  },
];

export const getMembershipAggregatorQueryForList = (): PipelineStage[] => [
  {
    $lookup: {
      from: "memberships",
      localField: "_id",
      foreignField: "tenantId",
      as: "memberships",
    },
  },
  {
    $addFields: {
      membershipsCount: {
        $cond: {
          if: { $isArray: "$memberships" },
          then: { $size: "$memberships" },
          else: 0,
        },
      },
    },
  },
];

export const getProcessingAggregatorQueryForList = (): PipelineStage[] => [
  {
    $project: {
      audits: 0,
      memberships: 0,
      deleteMarker: 0,
    },
  },
];
