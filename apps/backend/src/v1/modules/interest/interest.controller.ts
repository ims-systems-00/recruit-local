import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import {
  ApiResponse,
  ControllerParams,
  formatListResponse,
  NotFoundException,
  UnauthorizedException,
} from "../../../common/helper";
import { InterestAbilityBuilder, InterestAuthZEntity, ALL_INTEREST_FIELDS } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import * as interestService from "./interest.service";
import { sanitizeDocument, sanitizeDocuments, validateUpdatePayload } from "../../../common/helper/authz";
import { interestRoleScopedSecurityQuery } from "./interest.query";
import { assertCanReadJobProfile, assertProfileScopedListAccess } from "../job-profile/job-profile.access";

const caslFieldOptions = {
  fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_INTEREST_FIELDS,
};

/**
 * Internal helper to keep the controller clean.
 * Sanitizes a single interest document based on 'Read' permissions.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSanitizedInterestResponse = (doc: any, ability: any) => {
  return sanitizeDocument<InterestAuthZEntity>(doc, ability, AbilityAction.Read, InterestAuthZEntity, caslFieldOptions);
};

export const list = async ({ req }: ControllerParams) => {
  const abilityBuilder = new InterestAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Read, InterestAuthZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read interests.`);
  }

  // Reading someone else's interests is only allowed while their profile is.
  await assertProfileScopedListAccess(req.session, req.query.jobProfileId);

  const filter = new MongoQuery(req.query, {
    searchFields: ["name", "description"],
  }).build();

  const finalQuery = {
    $and: [filter.getFilterQuery(), interestRoleScopedSecurityQuery(ability)],
  };

  const results = await interestService.list({
    query: finalQuery,
    options: filter.getQueryOptions(),
  });

  const sanitizedDocs = sanitizeDocuments<InterestAuthZEntity>(
    results.docs,
    ability,
    AbilityAction.Read,
    InterestAuthZEntity,
    caslFieldOptions
  );

  const { data, pagination } = formatListResponse({ ...results, docs: sanitizedDocs });

  return new ApiResponse({
    message: "Interests retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "interests",
    pagination,
  });
};

export const getOne = async ({ req }: ControllerParams) => {
  const abilityBuilder = new InterestAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const interest = await interestService.getOne({ query: { _id: req.params.id } });

  if (!interest || !ability.can(AbilityAction.Read, new InterestAuthZEntity(interest))) {
    throw new UnauthorizedException("You do not have permission to view this interest.");
  }

  if (String(interest.jobProfileId) !== req.session.jobProfileId) {
    await assertCanReadJobProfile(req.session, String(interest.jobProfileId));
  }

  return new ApiResponse({
    message: "Interest retrieved.",
    statusCode: StatusCodes.OK,
    data: getSanitizedInterestResponse(interest, ability),
    fieldName: "interest",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const abilityBuilder = new InterestAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Create, InterestAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to create interests.");
  }

  validateUpdatePayload(req.body, ability, AbilityAction.Create, new InterestAuthZEntity(req.body));

  const interest = await interestService.create({
    ...req.body,
    userId: req.session.user?._id,
  });

  return new ApiResponse({
    message: "Interest created.",
    statusCode: StatusCodes.CREATED,
    data: getSanitizedInterestResponse(interest, ability),
    fieldName: "interest",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const abilityBuilder = new InterestAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingInterest = await interestService.getOne({ query: { _id: req.params.id } });
  if (!existingInterest) throw new NotFoundException("Interest not found");

  const authZEntity = new InterestAuthZEntity(existingInterest);

  if (!ability.can(AbilityAction.Update, authZEntity)) {
    throw new UnauthorizedException("You do not have permission to update this interest.");
  }

  validateUpdatePayload(req.body, ability, AbilityAction.Update, authZEntity);

  const interest = await interestService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "Interest updated.",
    statusCode: StatusCodes.OK,
    data: getSanitizedInterestResponse(interest, ability),
    fieldName: "interest",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new InterestAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingInterest = await interestService.getOne({ query: { _id: req.params.id } });

  if (!existingInterest || !ability.can(AbilityAction.SoftDelete, new InterestAuthZEntity(existingInterest))) {
    throw new UnauthorizedException("You do not have permission to delete this interest.");
  }

  await interestService.softRemove({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Interest moved to trash.",
    statusCode: StatusCodes.OK,
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new InterestAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingInterest = await interestService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!existingInterest || !ability.can(AbilityAction.HardDelete, new InterestAuthZEntity(existingInterest))) {
    throw new UnauthorizedException("You do not have permission to permanently delete this interest.");
  }

  await interestService.hardRemove({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Interest permanently deleted.",
    statusCode: StatusCodes.OK,
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const abilityBuilder = new InterestAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingInterest = await interestService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!existingInterest || !ability.can(AbilityAction.Restore, new InterestAuthZEntity(existingInterest))) {
    throw new UnauthorizedException("You do not have permission to restore this interest.");
  }

  const result = await interestService.restore({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Interest restored.",
    statusCode: StatusCodes.OK,
    data: getSanitizedInterestResponse(result, ability),
    fieldName: "interest",
  });
};
