import { StatusCodes } from "http-status-codes";
import { ApiResponse, ControllerParams, NotFoundException, UnauthorizedException } from "../../../common/helper";
import { TrainingAbilityBuilder, TrainingAuthZEntity, ALL_TRAINING_FIELDS } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import * as trainingService from "./training.service";
import { sanitizeDocument, sanitizeDocuments, validateUpdatePayload } from "../../../common/helper/authz";
import { trainingListQuerySpec, trainingRoleScopedSecurityQuery } from "./training.query";
import { runCursorList } from "../../../common/query";
import { assertCanReadJobProfile, assertProfileScopedListAccess } from "../job-profile/job-profile.access";
import { toTrainingResponse, toTrainingResponseList } from "./training.dto";

const caslFieldOptions = {
  fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_TRAINING_FIELDS,
};

/**
 * Internal helper to keep the controller clean.
 * Sanitizes a single training document based on 'Read' permissions.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSanitizedTrainingResponse = (doc: any, ability: any) => {
  return sanitizeDocument<TrainingAuthZEntity>(doc, ability, AbilityAction.Read, TrainingAuthZEntity, caslFieldOptions);
};

export const list = async ({ req }: ControllerParams) => {
  const abilityBuilder = new TrainingAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Read, TrainingAuthZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read trainings.`);
  }

  // Reading someone else's trainings is only allowed while their profile is.
  await assertProfileScopedListAccess(req.session, req.query.jobProfileId);

  const { docs, pagination } = await runCursorList({
    query: req.query,
    spec: trainingListQuerySpec,
    securityQuery: trainingRoleScopedSecurityQuery(ability),
    fetch: ({ query, options, offset }) => trainingService.list({ query, options, offset }),
  });

  // After the cursor is built: field stripping can drop the field it keys on.
  const sanitizedDocs = sanitizeDocuments<TrainingAuthZEntity>(
    docs,
    ability,
    AbilityAction.Read,
    TrainingAuthZEntity,
    caslFieldOptions
  );

  return new ApiResponse({
    message: "Trainings retrieved",
    statusCode: StatusCodes.OK,
    data: toTrainingResponseList(sanitizedDocs),
    fieldName: "trainings",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const abilityBuilder = new TrainingAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const training = await trainingService.getOne({ query: { _id: req.params.id } });

  if (!training || !ability.can(AbilityAction.Read, new TrainingAuthZEntity(training))) {
    throw new UnauthorizedException("You do not have permission to view this training.");
  }

  if (String(training.jobProfileId) !== req.session.jobProfileId) {
    await assertCanReadJobProfile(req.session, String(training.jobProfileId));
  }

  return new ApiResponse({
    message: "Training retrieved.",
    statusCode: StatusCodes.OK,
    data: toTrainingResponse(getSanitizedTrainingResponse(training, ability)),
    fieldName: "training",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const abilityBuilder = new TrainingAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const authZEntity = new TrainingAuthZEntity(req.body);

  // Row-Level Check: against the profile the training is being added to.
  if (!ability.can(AbilityAction.Create, authZEntity)) {
    throw new UnauthorizedException("You are not authorized to add trainings to this profile.");
  }

  // Field-Level Check
  validateUpdatePayload(req.body, ability, AbilityAction.Create, authZEntity);

  const training = await trainingService.create({
    payload: { ...req.body, userId: req.session.user?._id },
  });

  return new ApiResponse({
    message: "Training created successfully.",
    statusCode: StatusCodes.CREATED,
    data: toTrainingResponse(getSanitizedTrainingResponse(training, ability)),
    fieldName: "training",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const abilityBuilder = new TrainingAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingTraining = await trainingService.getOne({ query: { _id: req.params.id } });
  if (!existingTraining) throw new NotFoundException("Training not found");

  const authZEntity = new TrainingAuthZEntity(existingTraining);

  // Row-Level Check
  if (!ability.can(AbilityAction.Update, authZEntity)) {
    throw new UnauthorizedException("User is not authorized to update this training.");
  }

  // Field-Level Check
  validateUpdatePayload(req.body, ability, AbilityAction.Update, authZEntity);

  const training = await trainingService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "Training updated successfully.",
    statusCode: StatusCodes.OK,
    data: toTrainingResponse(getSanitizedTrainingResponse(training, ability)),
    fieldName: "training",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new TrainingAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingTraining = await trainingService.getOne({ query: { _id: req.params.id } });

  if (!existingTraining || !ability.can(AbilityAction.SoftDelete, new TrainingAuthZEntity(existingTraining))) {
    throw new UnauthorizedException("You do not have permission to delete this training.");
  }

  const training = await trainingService.softRemove({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Training removed successfully.",
    statusCode: StatusCodes.OK,
    data: toTrainingResponse(getSanitizedTrainingResponse(training, ability)),
    fieldName: "training",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const abilityBuilder = new TrainingAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingTraining = await trainingService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!existingTraining || !ability.can(AbilityAction.Restore, new TrainingAuthZEntity(existingTraining))) {
    throw new UnauthorizedException("You do not have permission to restore this training.");
  }

  const training = await trainingService.restore({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Training restored successfully.",
    statusCode: StatusCodes.OK,
    data: toTrainingResponse(getSanitizedTrainingResponse(training, ability)),
    fieldName: "training",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new TrainingAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingTraining = await trainingService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!existingTraining || !ability.can(AbilityAction.HardDelete, new TrainingAuthZEntity(existingTraining))) {
    throw new UnauthorizedException("You do not have permission to permanently delete this training.");
  }

  const training = await trainingService.hardRemove({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Training permanently removed.",
    statusCode: StatusCodes.OK,
    data: toTrainingResponse(getSanitizedTrainingResponse(training, ability)),
    fieldName: "training",
  });
};
