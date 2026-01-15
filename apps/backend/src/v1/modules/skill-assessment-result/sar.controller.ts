import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import {
  ApiResponse,
  ControllerParams,
  formatListResponse,
  logger,
  NotFoundException,
  pick,
  UnauthorizedException,
} from "../../../common/helper";
import { UserAbilityBuilder, EventRegistrationAuthZEntity } from "@inrm/authz";
import { AbilityAction } from "@inrm/types";
import { roleScopedSecurityQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import * as skillAssessmentResultService from "./sar.service";

export const list = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.Read, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read skill assessment results.`);
  //   }

  const filter = new MongoQuery(req.query, {
    searchFields: ["assessmentName", "candidateName"],
  }).build();

  const userSearchQuery = filter.getFilterQuery();
  const options = filter.getQueryOptions();
  //   const securityQuery = roleScopedSecurityQuery(EventRegistrationAuthZEntity, ability);

  const finalQuery = {
    $and: [userSearchQuery /*securityQuery*/],
  };

  const results = await skillAssessmentResultService.list({
    query: sanitizeQueryIds(finalQuery) as unknown,
    options,
  });

  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Skill assessment results retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "skillAssessmentResults",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const skillAssessmentResult = await skillAssessmentResultService.getOne(sanitizeQueryIds({ _id: req.params.id }));
  if (!skillAssessmentResult) {
    throw new NotFoundException(`Skill assessment result ${req.params.id} not found.`);
  }
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.Read, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read skill assessment results.`);
  //   }

  return new ApiResponse({
    message: "Skill assessment result retrieved",
    statusCode: StatusCodes.OK,
    data: skillAssessmentResult,
    fieldName: "skillAssessmentResult",
  });
};

export const create = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();
  //   if (!ability.can(AbilityAction.Create, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to create skill assessment results.`);
  //   }

  // todo: Get job profile id from req.session later

  const skillAssessmentResult = await skillAssessmentResultService.create(req.body);
  return new ApiResponse({
    message: "Skill assessment result created",
    statusCode: StatusCodes.CREATED,
    data: skillAssessmentResult,
    fieldName: "skillAssessmentResult",
  });
};

export const update = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();
  //   if (!ability.can(AbilityAction.Update, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to update skill assessment results.`);
  //   }
  const updatedSkillAssessmentResult = await skillAssessmentResultService.update(req.params.id, req.body);

  return new ApiResponse({
    message: "Skill assessment result updated",
    statusCode: StatusCodes.OK,
    data: updatedSkillAssessmentResult,
    fieldName: "skillAssessmentResult",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();
  //   if (!ability.can(AbilityAction.Delete, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to delete skill assessment results.`);
  //   }

  const deletedSkillAssessmentResult = await skillAssessmentResultService.softRemove(req.params.id);

  return new ApiResponse({
    message: "Skill assessment result moved to trash",
    statusCode: StatusCodes.OK,
    data: deletedSkillAssessmentResult,
    fieldName: "skillAssessmentResult",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();
  //   if (!ability.can(AbilityAction.Restore, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to restore skill assessment results.`);
  //   }

  const restoredSkillAssessmentResult = await skillAssessmentResultService.restore(req.params.id);

  return new ApiResponse({
    message: "Skill assessment result restored from trash",
    statusCode: StatusCodes.OK,
    data: restoredSkillAssessmentResult,
    fieldName: "skillAssessmentResult",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();
  //   if (!ability.can(AbilityAction.ForceDelete, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to permanently delete skill assessment results.`);
  //   }

  const hardDeletedSkillAssessmentResult = await skillAssessmentResultService.hardRemove(req.params.id);

  return new ApiResponse({
    message: "Skill assessment result permanently deleted",
    statusCode: StatusCodes.OK,
    data: hardDeletedSkillAssessmentResult,
    fieldName: "skillAssessmentResult",
  });
};
