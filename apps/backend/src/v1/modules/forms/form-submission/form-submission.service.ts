import mongoose, { PipelineStage } from "mongoose";
import { BadRequestException, logger, NotFoundException } from "../../../../common/helper";
import {
  IListFormSubmissionParams,
  ICreateFormSubmission,
  IGetFormSubmission,
  IUpdateFormSubmission,
} from "./form-submission.interface";
import { FormSubmission, IFormSubmissionDoc, FormResponse } from "../../../../models";

const populates = [
  {
    path: "formId",
    select: "title status",
  },
  {
    path: "submittedBy",
    select: "fullName email profileImageSrc",
  },
];

export const listFormSubmission = async ({ query = {}, options }: IListFormSubmissionParams) => {
  const formSubmissions = await FormSubmission.paginateAndExcludeDeleted(
    { ...query, formId: query.formId },
    { ...options, populate: populates }
  );

  const { docs, ...pagination } = formSubmissions;
  return { data: docs, pagination };
};

export const getFormSubmission = async ({ submissionId, formId, tenantId }: IGetFormSubmission) => {
  const formSubmission = await FormSubmission.findOne({ _id: submissionId, formId: formId, tenantId: tenantId });
  if (!formSubmission) throw new NotFoundException("Form submission not found.");

  const createMatchStage = ({ submissionId, formId, tenantId }: IGetFormSubmission) => [
    {
      $match: {
        _id: new mongoose.Types.ObjectId(submissionId.toString()),
        formId: new mongoose.Types.ObjectId(formId.toString()),
        tenantId: tenantId ? new mongoose.Types.ObjectId(tenantId.toString()) : null,
      },
    },
  ];

  const createPopulateFormResponsesStage = () => [
    {
      $lookup: {
        from: "formresponses",
        localField: "_id",
        foreignField: "formSubmissionId",
        as: "responses",
      },
    },
    {
      $unwind: "$responses",
    },
  ];

  const createPopulateElementsStage = () => [
    {
      $lookup: {
        from: "formelements",
        localField: "responses.formElementId",
        foreignField: "_id",
        as: "formElements",
      },
    },
    {
      $unwind: "$formElements",
    },
  ];

  const createLinkedCollectionStage = (collectionName: string | null) =>
    collectionName
      ? [
          {
            $lookup: {
              from: collectionName,
              localField: "collectionDocument",
              foreignField: "_id",
              as: "linkedObject",
            },
          },
          {
            $unwind: "$linkedObject",
          },
        ]
      : [];

  const createGraphLookupStage = () => [
    {
      $match: {
        "formElements.previousElementId": null,
      },
    },
    {
      $graphLookup: {
        from: "formelements",
        startWith: "$formElements._id",
        connectFromField: "nextElementId",
        connectToField: "_id",
        as: "formSequence",
        depthField: "order",
      },
    },
    {
      $unwind: "$formSequence",
    },
  ];

  const createPopulateResponseValueStage = () => [
    {
      $lookup: {
        from: "formresponses",
        let: { formElementId: "$formSequence._id", submissionId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$formElementId", "$$formElementId"] },
                  { $eq: ["$formSubmissionId", "$$submissionId"] },
                ],
              },
            },
          },
        ],
        as: "responseValue",
      },
    },
    {
      $unwind: {
        path: "$responseValue",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $sort: { "formSequence.order": 1 as 1 | -1 },
    },
  ];

  const createPopulateFormStage = () => [
    {
      $lookup: {
        from: "forms",
        localField: "formId",
        foreignField: "_id",
        pipeline: [{ $project: { title: 1, status: 1 } }],
        as: "form",
      },
    },
    {
      $unwind: "$form",
    },
  ];

  const createPopulateSubmittedByStage = () => [
    {
      $lookup: {
        from: "users",
        localField: "submittedBy",
        foreignField: "_id",
        pipeline: [{ $project: { fullName: 1, email: 1, profileImageSrc: 1 } }],
        as: "submittedBy",
      },
    },
    {
      $unwind: {
        path: "$submittedBy",
        preserveNullAndEmptyArrays: true,
      },
    },
  ];

  const createGroupStage = () => [
    {
      $group: {
        _id: "$_id",
        form: { $first: "$form" },
        linkedObject: { $first: "$linkedObject" },
        submittedBy: { $first: "$submittedBy" },
        responses: {
          $push: {
            formElementId: "$formSequence._id",
            type: "$formSequence.type",
            attributes: "$formSequence.attributes",
            responseValue: "$responseValue.responseValue",
          },
        },
        tenantId: { $first: "$tenantId" },
      },
    },
  ];

  const pipeline: PipelineStage[] = [
    ...createMatchStage({ submissionId, formId, tenantId }),
    ...createPopulateFormResponsesStage(),
    ...createPopulateElementsStage(),
    ...createGraphLookupStage(),
    ...createPopulateResponseValueStage(),
    ...createPopulateFormStage(),
    ...createPopulateSubmittedByStage(),
    ...createLinkedCollectionStage(formSubmission.collectionName),
    ...createGroupStage(),
  ];

  const result = await FormSubmission.aggregate(pipeline);

  if (!result.length) throw new NotFoundException("Form submission not found.");

  return result[0];
};

export const updateFormSubmission = async (id: string, payload: IUpdateFormSubmission) => {
  let formSubmission: IFormSubmissionDoc;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    formSubmission = await FormSubmission.findById(id).session(session);
    if (!formSubmission) throw new NotFoundException("Form submission not found.");

    const { formId, tenantId } = formSubmission;

    const bulkOps = payload.responses.map((response) => ({
      updateOne: {
        filter: { formId, formSubmissionId: id, formElementId: response.formElementId, tenantId },
        update: { $set: { responseValue: response.responseValue } },
        upsert: false,
      },
    }));

    if (bulkOps.length > 0) {
      await FormResponse.bulkWrite(bulkOps, { session });
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
  return formSubmission;
};

export const createFormSubmission = async (payload: ICreateFormSubmission) => {
  const { formId, collectionDocument, collectionName, submittedBy, responses } = payload;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Create form submission
    const formSubmission = new FormSubmission({ formId, collectionDocument, collectionName, submittedBy });
    await formSubmission.save({ session });
    if (!formSubmission) throw new BadRequestException("Failed to create form submission.");

    // Create form responses
    const formResponses = await FormResponse.insertMany(
      responses.map((response) => ({
        ...response,
        formId,
        formSubmissionId: formSubmission._id,
      })),
      { session }
    );
    if (!formResponses) throw new BadRequestException("Failed to create form responses.");

    await session.commitTransaction();
    await session.endSession();

    return { ...formSubmission.toJSON(), responses: formResponses };
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
};

export const hardRemoveFormSubmission = async (id: string) => {
  const formSubmission = await FormSubmission.findById(id);
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    await FormSubmission.findByIdAndDelete(id, { session });
    await FormResponse.deleteMany({ formSubmissionId: id }, { session });

    await session.commitTransaction();
    await session.endSession();

    return formSubmission;
  } catch (error) {
    logger.error("Error in hardRemoveFormSubmission", error);
    await session.abortTransaction();
    await session.endSession();
    throw new BadRequestException("Transaction Failed");
  }
};
