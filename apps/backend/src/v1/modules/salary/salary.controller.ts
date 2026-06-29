import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { SalaryAbilityBuilder, SalaryAuthZEntity } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import { ApiResponse, ControllerParams, formatListResponse, UnauthorizedException } from "../../../common/helper";
import * as salaryService from "./salary.service";

export const list = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["jobTitle", "location", "experienceLevel", "currency"],
  }).build();
  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const results = await salaryService.list({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Salaries retrieved.",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "salaries",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const salary = await salaryService.getOne({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Salary retrieved.",
    statusCode: StatusCodes.OK,
    data: salary,
    fieldName: "salary",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const ability = new SalaryAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.Create, SalaryAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to create salaries.");
  }

  const salary = await salaryService.create(req.body);

  return new ApiResponse({
    message: "Salary created.",
    statusCode: StatusCodes.CREATED,
    data: salary,
    fieldName: "salary",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const ability = new SalaryAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.Update, new SalaryAuthZEntity({ _id: req.params.id }))) {
    throw new UnauthorizedException("You are not authorized to update this salary.");
  }

  const salary = await salaryService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "Salary updated.",
    statusCode: StatusCodes.OK,
    data: salary,
    fieldName: "salary",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  const ability = new SalaryAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.SoftDelete, new SalaryAuthZEntity({ _id: req.params.id }))) {
    throw new UnauthorizedException("You are not authorized to delete this salary.");
  }

  const salary = await salaryService.softRemove({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Salary moved to trash.",
    statusCode: StatusCodes.OK,
    data: salary,
    fieldName: "salary",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  const ability = new SalaryAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.HardDelete, new SalaryAuthZEntity({ _id: req.params.id }))) {
    throw new UnauthorizedException("You are not authorized to permanently delete this salary.");
  }

  const salary = await salaryService.hardRemove({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Salary permanently deleted.",
    statusCode: StatusCodes.OK,
    data: salary,
    fieldName: "salary",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const ability = new SalaryAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.Restore, new SalaryAuthZEntity({ _id: req.params.id }))) {
    throw new UnauthorizedException("You are not authorized to restore this salary.");
  }

  const salary = await salaryService.restore({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Salary restored from trash.",
    statusCode: StatusCodes.OK,
    data: salary,
    fieldName: "salary",
  });
};
