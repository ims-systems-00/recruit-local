import { PipelineStage } from "mongoose";
import { VERIFICATION_TOKEN_TYPE_ENUMS } from "../../../models/constants";
import { Query } from "./invitation.interface";

const ALLOWED_INVITATION_TYPES: VERIFICATION_TOKEN_TYPE_ENUMS[] = [
  VERIFICATION_TOKEN_TYPE_ENUMS.INVITATION_IN_CLIENT_ORG,
  VERIFICATION_TOKEN_TYPE_ENUMS.INVITATION_IN_INTERFACE_NRM,
  VERIFICATION_TOKEN_TYPE_ENUMS.INVITATION_IN_AUDIT,
] as const;

export const getMatchAggregatorQuery = (query: Query): PipelineStage[] => {
  const { type: requestedType, ...filterParams } = query;
  const typeFilter =
    requestedType && ALLOWED_INVITATION_TYPES.includes(requestedType) ? [requestedType] : ALLOWED_INVITATION_TYPES;

  return [
    {
      $match: {
        ...filterParams,
        type: { $in: typeFilter },
      },
    },
  ];
};

export const getProjectingAggregatorQuery = (): PipelineStage[] => [
  {
    $project: {
      token: 0,
      __v: 0,
    },
  },
];
