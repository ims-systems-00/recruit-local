import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { ApiResponse, ControllerParams, formatListResponse, UnauthorizedException } from "../../../common/helper";
import { CvAbilityBuilder, CvAuthZEntity } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import * as cvService from "./cv.service";
import { cvRoleScopedSecurityQuery } from "./cv.query";

export const list = async ({ req }: ControllerParams) => {
  const abilityBuilder = new CvAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Read, CvAuthZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read CVs.`);
  }

  const filter = new MongoQuery(req.query, {
    searchFields: ["title", "summary", "skills"],
  }).build();

  const userSearchQuery = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const securityQuery = cvRoleScopedSecurityQuery(ability);

  const finalQuery = {
    $and: [userSearchQuery, securityQuery],
  };

  const results = await cvService.list({ query: finalQuery, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "CVs retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "cvs",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const abilityBuilder = new CvAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const cv = await cvService.getOne({ query: { _id: req.params.id } });

  if (!cv || !ability.can(AbilityAction.Read, new CvAuthZEntity(cv))) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read this CV.`);
  }

  return new ApiResponse({
    message: "CV retrieved.",
    statusCode: StatusCodes.OK,
    data: cv,
    fieldName: "cv",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const abilityBuilder = new CvAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  // Fetch the existing CV first to check ownership properties
  const existingCv = await cvService.getOne({ query: { _id: req.params.id } });

  if (!existingCv || !ability.can(AbilityAction.Update, new CvAuthZEntity(existingCv))) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to update this CV.`);
  }

  const cv = await cvService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "CV updated.",
    statusCode: StatusCodes.OK,
    data: cv,
    fieldName: "cv",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const abilityBuilder = new CvAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Create, CvAuthZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to create a CV.`);
  }

  const userId = req.session.user?._id;

  // Updated: wrapped req.body and userId inside the payload property!
  const cv = await cvService.create({
    payload: { ...req.body, userId },
  });

  return new ApiResponse({
    message: "CV created successfully.",
    statusCode: StatusCodes.CREATED,
    data: cv,
    fieldName: "cv",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new CvAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingCv = await cvService.getOne({ query: { _id: req.params.id } });

  if (!existingCv || !ability.can(AbilityAction.Delete, new CvAuthZEntity(existingCv))) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to delete this CV.`);
  }

  await cvService.softDelete({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "CV removed successfully.",
    statusCode: StatusCodes.OK,
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const abilityBuilder = new CvAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  // Must fetch from trash to perform the ownership check!
  const existingCv = await cvService.getOneSoftDeleted({ query: { _id: req.params.id } });

  // Note: Using AbilityAction.Update for restore based on standard CASL patterns (or AbilityAction.Restore if you have it in your enum)
  if (!existingCv || !ability.can(AbilityAction.Update, new CvAuthZEntity(existingCv))) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to restore this CV.`);
  }

  await cvService.restore({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "CV restored successfully.",
    statusCode: StatusCodes.OK,
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new CvAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingCv = await cvService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!existingCv || !ability.can(AbilityAction.Delete, new CvAuthZEntity(existingCv))) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to permanently delete this CV.`);
  }

  await cvService.hardDelete({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "CV deleted permanently.",
    statusCode: StatusCodes.OK,
  });
};
