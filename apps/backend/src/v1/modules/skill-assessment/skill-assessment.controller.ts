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
import { UserAbilityBuilder, EventRegistrationAuthZEntity } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import { roleScopedSecurityQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import * as skillAssessmentService from "./skill-assessment.service";

export const list = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.Read, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read skill assessments.`);
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

  const results = await skillAssessmentService.list({
    query: sanitizeQueryIds(finalQuery) as unknown,
    options,
  });

  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Skill assessments retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "skillAssessments",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const skillAssessment = await skillAssessmentService.getOne(sanitizeQueryIds({ _id: req.params.id }));
  if (!skillAssessment) {
    throw new NotFoundException(`Skill assessment ${req.params.id} not found.`);
  }
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.Read, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read skill assessment ${req.params.id}.`);
  //   }

  return new ApiResponse({
    message: "Skill assessment retrieved",
    statusCode: StatusCodes.OK,
    data: skillAssessment,
    fieldName: "skillAssessment",
  });
};

export const create = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();
  //   if (!ability.can(AbilityAction.Create, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to create skill assessments.`);
  //   }

  const newSkillAssessment = await skillAssessmentService.create(req.body);

  return new ApiResponse({
    message: "Skill assessment created",
    statusCode: StatusCodes.CREATED,
    data: newSkillAssessment,
    fieldName: "skillAssessment",
  });
};

export const update = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.Update, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to update skill assessments.`);
  //   }
  const updatedSkillAssessment = await skillAssessmentService.update(req.params.id, req.body);

  if (!updatedSkillAssessment) {
    throw new NotFoundException(`Skill assessment ${req.params.id} not found.`);
  }

  return new ApiResponse({
    message: "Skill assessment updated",
    statusCode: StatusCodes.OK,
    data: updatedSkillAssessment,
    fieldName: "skillAssessment",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.Delete, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to delete skill assessments.`);
  //   }
  const removedSkillAssessment = await skillAssessmentService.softRemove(req.params.id);
  if (!removedSkillAssessment) {
    throw new NotFoundException(`Skill assessment ${req.params.id} not found.`);
  }

  return new ApiResponse({
    message: "Skill assessment removed",
    statusCode: StatusCodes.OK,
    data: removedSkillAssessment,
    fieldName: "skillAssessment",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.Restore, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to restore skill assessments.`);
  //   }
  const restoredSkillAssessment = await skillAssessmentService.restore(req.params.id);
  if (!restoredSkillAssessment) {
    throw new NotFoundException(`Skill assessment ${req.params.id} not found.`);
  }
  return new ApiResponse({
    message: "Skill assessment restored",
    statusCode: StatusCodes.OK,
    data: restoredSkillAssessment,
    fieldName: "skillAssessment",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.Delete, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to hard delete skill assessments.`);
  //   }
  const deletedSkillAssessment = await skillAssessmentService.hardRemove(req.params.id);
  if (!deletedSkillAssessment) {
    throw new NotFoundException(`Skill assessment ${req.params.id} not found.`);
  }
  return new ApiResponse({
    message: "Skill assessment permanently deleted",
    statusCode: StatusCodes.OK,
    data: deletedSkillAssessment,
    fieldName: "skillAssessment",
  });
};
