import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { ApiResponse, ControllerParams, formatListResponse, UnauthorizedException } from "../../../common/helper";
import { UserAbilityBuilder, UserAuthZEntity } from "@inrm/authz";
import { AbilityAction, ACCOUNT_TYPE_ENUMS } from "@inrm/types";
import * as skillService from "./skill.service";

export const list = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["name", "description"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Read, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Read} skills.`
  //     );

  const results = await skillService.list({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Skills retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "skills",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const skill = await skillService.getOne(req.params.id);

  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Read, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Read} skill.`
  //     );

  return new ApiResponse({
    message: "Skill retrieved.",
    statusCode: StatusCodes.OK,
    data: skill,
    fieldName: "skill",
  });
};

export const update = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Update, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Update} skill.`
  //     );
  const skill = await skillService.update(req.params.id, req.body);
  return new ApiResponse({
    message: "Skill updated.",
    statusCode: StatusCodes.OK,
    data: skill,
    fieldName: "skill",
  });
};

export const create = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Create, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Create} skill.`
  //     );
  const userId = req.session.user?.id;

  const skill = await skillService.create({
    ...req.body,
    userId: userId!,
  });
  return new ApiResponse({
    message: "Skill created.",
    statusCode: StatusCodes.CREATED,
    data: skill,
    fieldName: "skill",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Delete, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Delete} skill.`
  //     );
  const { skill, deleted } = await skillService.softRemove(req.params.id);
  return new ApiResponse({
    message: "Skill moved to trash.",
    statusCode: StatusCodes.OK,
    data: { skill, deleted },
    fieldName: "softDeletedSkill",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Delete, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Delete} skill.`
  //     );
  const skill = await skillService.hardRemove(req.params.id);
  return new ApiResponse({
    message: "Skill permanently deleted.",
    statusCode: StatusCodes.OK,
    data: skill,
    fieldName: "hardDeletedSkill",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Restore, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Restore} skill.`
  //     );
  const { skill, restored } = await skillService.restore(req.params.id);
  return new ApiResponse({
    message: "Skill restored from trash.",
    statusCode: StatusCodes.OK,
    data: { skill, restored },
    fieldName: "restoredSkill",
  });
};
