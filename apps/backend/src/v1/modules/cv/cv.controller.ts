import { StatusCodes } from "http-status-codes";
import {
  ApiResponse,
  BadRequestException,
  ControllerParams,
  ForbiddenException,
  UnauthorizedException,
  logger,
} from "../../../common/helper";
import { CvAbilityBuilder, CvAuthZEntity } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import { Types } from "mongoose";
import * as cvService from "./cv.service";
import * as cvExtractService from "./cv-extract.service";
import { matchCvEntities } from "./cv-match.service";
import {
  asText,
  importCvRecords,
  importCvIntoProfile,
  matchCvSkills,
  normalizeCvForProfile,
} from "./cv-profile-import";
import { enqueueProfileCompletion } from "../../../queue/profileCompletionUpdateQueue";
import { cvListQuerySpec, cvRoleScopedSecurityQuery } from "./cv.query";
import { runCursorList } from "../../../common/query";
import { assertCanReadJobProfile, assertProfileScopedListAccess } from "../job-profile/job-profile.access";
import { toCvResponse, toCvResponseList } from "./cv.dto";

export const list = async ({ req }: ControllerParams) => {
  const abilityBuilder = new CvAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Read, CvAuthZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read CVs.`);
  }

  // Reading someone else's CVs is only allowed while their profile is.
  const requestedProfileId = typeof req.query.jobProfileId === "string" ? req.query.jobProfileId : undefined;
  await assertProfileScopedListAccess(req.session, requestedProfileId);

  // Unlike the other profile-scoped lists, a candidate's CASL rules also match
  // any published CV, so the security query alone does not keep this list to one
  // person. Pin it to the profile the guard just authorised. An admin passing no
  // filter is the only caller that legitimately sees across profiles.
  const scopedProfileId = requestedProfileId ?? req.session.jobProfileId;

  const { docs, pagination } = await runCursorList({
    query: req.query,
    spec: cvListQuerySpec,
    securityQuery: cvRoleScopedSecurityQuery(ability),
    extraConditions: scopedProfileId ? [{ jobProfileId: scopedProfileId }] : [],
    fetch: ({ query, options, offset }) => cvService.list({ query, options, offset }),
  });

  return new ApiResponse({
    message: "CVs retrieved",
    statusCode: StatusCodes.OK,
    data: toCvResponseList(docs),
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

  if (String(cv.jobProfileId) !== req.session.jobProfileId) {
    await assertCanReadJobProfile(req.session, String(cv.jobProfileId));
  }

  return new ApiResponse({
    message: "CV retrieved.",
    statusCode: StatusCodes.OK,
    data: toCvResponse(cv),
    fieldName: "cv",
  });
};

/**
 * Signed links to the CV's resume file and its preview. Gated exactly like
 * `get`: whoever may read the CV may open its file, and nobody else — unlike
 * the generic file-storage view link, which only serves the caller's own uploads.
 */
export const resumeUrl = async ({ req }: ControllerParams) => {
  const abilityBuilder = new CvAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const cv = await cvService.getOne({ query: { _id: req.params.id } });

  if (!cv || !ability.can(AbilityAction.Read, new CvAuthZEntity(cv))) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read this CV.`);
  }

  if (String(cv.jobProfileId) !== req.session.jobProfileId) {
    await assertCanReadJobProfile(req.session, String(cv.jobProfileId));
  }

  return new ApiResponse({
    message: "Resume links signed.",
    statusCode: StatusCodes.OK,
    data: await cvService.signResume(cv),
    fieldName: "resume",
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
    data: toCvResponse(cv),
    fieldName: "cv",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const abilityBuilder = new CvAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  // Row-level: against the profile named in the body. Unlike the other profile
  // modules there is no field-level check here to catch someone else's profile.
  if (!ability.can(AbilityAction.Create, new CvAuthZEntity(req.body))) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to create a CV on this profile.`);
  }

  const userId = req.session.user?._id;

  // Updated: wrapped req.body and userId inside the payload property!
  const cv = await cvService.create({
    payload: { ...req.body, userId },
  });

  return new ApiResponse({
    message: "CV created successfully.",
    statusCode: StatusCodes.CREATED,
    data: toCvResponse(cv),
    fieldName: "cv",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new CvAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingCv = await cvService.getOne({ query: { _id: req.params.id } });

  if (!existingCv || !ability.can(AbilityAction.SoftDelete, new CvAuthZEntity(existingCv))) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to delete this CV.`);
  }

  const { cv } = await cvService.softDelete({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "CV removed successfully.",
    statusCode: StatusCodes.OK,
    data: { cv: toCvResponse(cv) },
    fieldName: "cv",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const abilityBuilder = new CvAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  // Must fetch from trash to perform the ownership check!
  const existingCv = await cvService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!existingCv || !ability.can(AbilityAction.Restore, new CvAuthZEntity(existingCv))) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to restore this CV.`);
  }

  const { cv } = await cvService.restore({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "CV restored successfully.",
    statusCode: StatusCodes.OK,
    data: { cv: toCvResponse(cv) },
    fieldName: "cv",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new CvAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingCv = await cvService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!existingCv || !ability.can(AbilityAction.HardDelete, new CvAuthZEntity(existingCv))) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to permanently delete this CV.`);
  }

  const { cv } = await cvService.hardDelete({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "CV deleted permanently.",
    statusCode: StatusCodes.OK,
    data: { cv: toCvResponse(cv) },
    fieldName: "cv",
  });
};

export const extract = async ({ req }: ControllerParams) => {
  const abilityBuilder = new CvAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const cv = await cvService.getOne({ query: { _id: req.params.id } });

  if (!cv || !ability.can(AbilityAction.Read, new CvAuthZEntity(cv))) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read this CV.`);
  }

  const resumeStorage = cv.resume?.storageInformation as { Bucket?: string; Key?: string } | undefined;
  if (!resumeStorage?.Bucket || !resumeStorage?.Key) {
    throw new BadRequestException("This CV has no uploaded resume to extract from.");
  }

  const rawExtracted = (await cvExtractService.extractFromResume({
    resumeStorage: { Bucket: resumeStorage.Bucket, Key: resumeStorage.Key },
  })) as Record<string, unknown>;
  const { jobTitles: _jt, industries: _ind, workModes: _wm, experienceLevels: _el, ...extractedData } = rawExtracted;

  const matched = await matchCvEntities(rawExtracted as Record<string, string[]>);

  return new ApiResponse({
    message: "CV data extracted.",
    statusCode: StatusCodes.OK,
    data: {
      extractedData,
      jobTitles: matched.jobTitles,
      industries: matched.industries,
      workModes: matched.workModes,
      experienceLevels: matched.experienceLevels,
    },
    fieldName: "cv",
  });
};

/**
 * "Import from CV" on the profile page: reads one of the candidate's own CVs.
 *
 * Work experience, education and trainings are records of their own, so they
 * are added straight away, and only while the candidate has none of that kind
 * (onboarding's rule).
 * Everything else is returned for the open edit form, under the profile's own
 * field names, and is saved only when the candidate presses Save. Email is left
 * out: it is the login, not a thing to change from a CV.
 */
export const importToProfile = async ({ req }: ControllerParams) => {
  const userId = req.session.user?._id;
  const jobProfileId = req.session.jobProfileId;
  if (!jobProfileId) throw new BadRequestException("No job profile found in session.");

  const cv = await cvService.getOne({ query: { _id: req.params.id } });
  // Ownership, not the Read rule: a candidate may read anyone's published CV,
  // and must not pull someone else's into their own profile.
  if (String(cv.jobProfileId) !== String(jobProfileId)) {
    throw new ForbiddenException("You can only import one of your own CVs.");
  }

  const resumeStorage = cv.resume?.storageInformation as { Bucket?: string; Key?: string } | undefined;
  if (!resumeStorage?.Bucket || !resumeStorage?.Key) {
    throw new BadRequestException("This CV has no uploaded resume to import from.");
  }

  const extracted = (await cvExtractService.extractFromResume({
    resumeStorage: { Bucket: resumeStorage.Bucket, Key: resumeStorage.Key },
  })) as Record<string, unknown>;
  const data = normalizeCvForProfile(extracted);
  const owner = { userId: new Types.ObjectId(userId), jobProfileId: new Types.ObjectId(jobProfileId) };

  const [matched, skills, added] = await Promise.all([
    matchCvEntities(extracted as Record<string, string[]>),
    matchCvSkills(data.skills),
    importCvRecords({ ...owner, data }),
  ]);

  if (Object.values(added).some(Boolean)) await enqueueProfileCompletion(owner.userId);

  return new ApiResponse({
    message: "CV imported.",
    statusCode: StatusCodes.OK,
    data: {
      profile: {
        name: asText(extracted.name),
        contactNumber: asText(extracted.phone),
        address: asText(extracted.address),
        summary: data.summary,
        interests: data.interests,
        jobTitle: matched.jobTitles,
        industry: matched.industries,
        workMode: matched.workModes,
        experienceLevel: matched.experienceLevels[0] ?? null,
        skills,
      },
      added,
    },
    fieldName: "cvImport",
  });
};

/**
 * Fills the candidate's empty About, experience, education and trainings from the CV.
 * Onboarding must not stall on it, so a failure is logged and swallowed.
 */
const importIntoProfile = async (
  owner: { userId: Types.ObjectId; jobProfileId: Types.ObjectId },
  extracted: Record<string, unknown>
) => {
  try {
    const data = normalizeCvForProfile(extracted);
    const imported = await importCvIntoProfile({ ...owner, data });
    // `found` against `imported` separates "the CV had none" from "the profile
    // already had some", which a bare `summary: false` cannot.
    logger.info("[extractAndCreate] Imported CV into profile", {
      jobProfileId: String(owner.jobProfileId),
      found: {
        summary: !!data.summary,
        experience: data.experience.length,
        education: data.education.length,
        trainings: data.trainings.length,
        skills: data.skills.length,
        interests: !!data.interests,
      },
      imported,
    });
  } catch (error) {
    logger.error("[extractAndCreate] Profile import failed", {
      jobProfileId: String(owner.jobProfileId),
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const extractAndCreate = async ({ req }: ControllerParams) => {
  const abilityBuilder = new CvAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Create, CvAuthZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to create a CV.`);
  }

  const { resumeStorage } = req.body;
  const userId = req.session.user?._id;
  const jobProfileId = req.session.jobProfileId;

  if (!jobProfileId) throw new BadRequestException("No job profile found in session.");

  const rawExtracted = (await cvExtractService.extractFromResume({ resumeStorage })) as Record<string, unknown>;
  const { jobTitles: _jt, industries: _ind, workModes: _wm, experienceLevels: _el, ...extractedData } = rawExtracted;

  const owner = { jobProfileId: new Types.ObjectId(jobProfileId), userId: new Types.ObjectId(userId) };

  const [cv, matched] = await Promise.all([
    cvService.create({ payload: { ...owner, resumeStorage } }),
    matchCvEntities(rawExtracted as Record<string, string[]>),
    importIntoProfile(owner, rawExtracted),
  ]);

  return new ApiResponse({
    message: "CV created from resume.",
    statusCode: StatusCodes.CREATED,
    data: {
      cv: toCvResponse(cv),
      extractedData,
      jobTitles: matched.jobTitles,
      industries: matched.industries,
      workModes: matched.workModes,
      experienceLevels: matched.experienceLevels,
    },
    fieldName: "cv",
  });
};
