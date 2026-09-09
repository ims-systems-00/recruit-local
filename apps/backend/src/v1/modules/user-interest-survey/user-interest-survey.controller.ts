import { StatusCodes } from "http-status-codes";
import { UserInterestSurveyAbilityBuilder, UserInterestSurveyAuthZEntity } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import { ApiResponse, ControllerParams, NotFoundException, UnauthorizedException } from "../../../common/helper";
import { Types } from "mongoose";
import * as surveyService from "./user-interest-survey.service";
import { surveyListQuerySpec, surveyRoleScopedSecurityQuery } from "./user-interest-survey.query";
import { runCursorList } from "../../../common/query";

export const list = async ({ req }: ControllerParams) => {
  const ability = new UserInterestSurveyAbilityBuilder(req.session).getAbility();

  if (!ability.can(AbilityAction.Read, UserInterestSurveyAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to list user interest surveys.");
  }

  const { docs, pagination } = await runCursorList({
    query: req.query,
    spec: surveyListQuerySpec,
    securityQuery: surveyRoleScopedSecurityQuery(ability),
    fetch: ({ query, options, offset }) => surveyService.list({ query, options, offset }),
    count: ({ query }) => surveyService.count({ query }),
  });

  return new ApiResponse({
    message: "User interest surveys retrieved.",
    statusCode: StatusCodes.OK,
    data: docs,
    fieldName: "userInterestSurveys",
    pagination,
  });
};

export const getMySurvey = async ({ req }: ControllerParams) => {
  const ability = new UserInterestSurveyAbilityBuilder(req.session).getAbility();
  const currentUserId = req.session.user?._id;

  if (!ability.can(AbilityAction.Read, new UserInterestSurveyAuthZEntity({ userId: currentUserId }))) {
    throw new UnauthorizedException("You are not authorized to view your survey.");
  }

  const survey = await surveyService.getOne({ query: { userId: new Types.ObjectId(currentUserId) } });

  return new ApiResponse({
    message: "User interest survey retrieved.",
    statusCode: StatusCodes.OK,
    data: survey,
    fieldName: "userInterestSurvey",
  });
};

export const get = async ({ req }: ControllerParams) => {
  const ability = new UserInterestSurveyAbilityBuilder(req.session).getAbility();

  const survey = await surveyService.getOne({ query: { _id: req.params.id } });

  if (!ability.can(AbilityAction.Read, new UserInterestSurveyAuthZEntity(survey))) {
    throw new UnauthorizedException("You do not have permission to view this survey.");
  }

  return new ApiResponse({
    message: "User interest survey retrieved.",
    statusCode: StatusCodes.OK,
    data: survey,
    fieldName: "userInterestSurvey",
  });
};

export const upsert = async ({ req }: ControllerParams) => {
  const ability = new UserInterestSurveyAbilityBuilder(req.session).getAbility();

  if (!ability.can(AbilityAction.Create, UserInterestSurveyAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to create a user interest survey.");
  }

  const userId = new Types.ObjectId(req.session.user?._id);

  const survey = await surveyService.upsert({ userId, payload: req.body });

  return new ApiResponse({
    message: "User interest survey saved.",
    statusCode: StatusCodes.OK,
    data: survey,
    fieldName: "userInterestSurvey",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const ability = new UserInterestSurveyAbilityBuilder(req.session).getAbility();

  const existing = await surveyService.getOne({ query: { _id: req.params.id } });

  if (!ability.can(AbilityAction.Update, new UserInterestSurveyAuthZEntity(existing))) {
    throw new UnauthorizedException("You are not authorized to update this survey.");
  }

  const survey = await surveyService.update({ query: { _id: req.params.id }, payload: req.body });

  return new ApiResponse({
    message: "User interest survey updated.",
    statusCode: StatusCodes.OK,
    data: survey,
    fieldName: "userInterestSurvey",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  const ability = new UserInterestSurveyAbilityBuilder(req.session).getAbility();

  const existing = await surveyService.getOne({ query: { _id: req.params.id } });

  if (!ability.can(AbilityAction.SoftDelete, new UserInterestSurveyAuthZEntity(existing))) {
    throw new UnauthorizedException("You are not authorized to delete this survey.");
  }

  await surveyService.softDelete({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "User interest survey moved to trash.",
    statusCode: StatusCodes.OK,
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  const ability = new UserInterestSurveyAbilityBuilder(req.session).getAbility();

  const existing = await surveyService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!ability.can(AbilityAction.HardDelete, new UserInterestSurveyAuthZEntity(existing))) {
    throw new UnauthorizedException("You are not authorized to permanently delete this survey.");
  }

  await surveyService.hardDelete({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "User interest survey permanently deleted.",
    statusCode: StatusCodes.OK,
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const ability = new UserInterestSurveyAbilityBuilder(req.session).getAbility();

  const existing = await surveyService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!ability.can(AbilityAction.Restore, new UserInterestSurveyAuthZEntity(existing))) {
    throw new UnauthorizedException("You are not authorized to restore this survey.");
  }

  await surveyService.restore({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "User interest survey restored.",
    statusCode: StatusCodes.OK,
  });
};
