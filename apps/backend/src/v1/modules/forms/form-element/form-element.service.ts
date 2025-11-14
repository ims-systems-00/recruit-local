import { Schema } from "mongoose";
import { BadRequestException, NotFoundException } from "../../../../common/helper";
import { FormElement, FormElementInput, IFormElementDoc } from "../../../../models";
import { IListFormElementParams } from "./form-element.interface";

export const listFormElement = async ({ query = {}, options }: IListFormElementParams) => {
  const aggregate = FormElement.aggregate([
    {
      $match: {
        ...query,
        previousElementId: null,
      },
    },

    // Use $graphLookup to recursively find all connected elements based on nextFormElement
    {
      $graphLookup: {
        from: "formelements",
        startWith: "$_id",
        connectFromField: "nextElementId",
        connectToField: "_id",
        as: "formSequence",
        depthField: "order",
      },
    },
    // Unwind the results for easy sorting and ordering
    {
      $unwind: "$formSequence",
    },
    // Sort the results by the recursion depth
    {
      $sort: { "formSequence.order": 1 },
    },
    // Project the ordered sequence
    {
      $project: {
        _id: "$formSequence._id",
        type: "$formSequence.type",
        attributes: "$formSequence.attributes",
        formId: "$formSequence.formId",
        nextElementId: "$formSequence.nextElementId",
        previousElementId: "$formSequence.previousElementId",
        parentElementId: "$formSequence.parentElementId",
        tenantId: "$formSequence.tenantId",
      },
    },
  ]);

  return FormElement.aggregatePaginate(aggregate, options);
};

export const getFormElement = async (id: string | Schema.Types.ObjectId) => {
  const formElement = await FormElement.findById(id);
  if (!formElement) throw new NotFoundException("FormElement not found.");

  return formElement;
};

export const updateFormElement = async (id: string, payload: Partial<IFormElementDoc>) => {
  await getFormElement(id);
  const updatedFormElement = await FormElement.findOneAndUpdate(
    { _id: id },
    {
      $set: { ...payload },
    },
    { new: true }
  );

  return updatedFormElement;
};

export const createFormElement = async (payload: FormElementInput) => {
  const newElement = new FormElement(payload);

  // If previous and next is null, then make head as true
  if (!payload.previousElementId && !payload.nextElementId) {
    await newElement.save();

    return newElement;
  }

  // if previous is exist and next is null, then this should be last node
  if (payload.previousElementId && !payload.nextElementId) {
    const previous = await getFormElement(payload.previousElementId);
    previous.nextElementId = newElement._id as Schema.Types.ObjectId;

    await previous.save();
    await newElement.save();

    return newElement;
  }

  // if previous is null and next is exist, then this should be head node
  if (!payload.previousElementId && payload.nextElementId) {
    const next = await getFormElement(payload.nextElementId);
    next.previousElementId = newElement._id as Schema.Types.ObjectId;

    await next.save();
    await newElement.save();

    return newElement;
  }

  // if previous and next is exist, then linked list insertion
  if (payload.previousElementId && payload.nextElementId) {
    const previous = await getFormElement(payload.previousElementId);
    previous.nextElementId = newElement._id as Schema.Types.ObjectId;

    const next = await getFormElement(payload.nextElementId);
    next.previousElementId = newElement._id as Schema.Types.ObjectId;

    await previous.save();
    await next.save();
    await newElement.save();

    return newElement;
  }

  throw new BadRequestException("Invalid form element placement.");
};

export const hardRemoveFormElement = async (id: string) => {
  const formElement = await getFormElement(id);

  const previousElement = await FormElement.findById(formElement.previousElementId);
  const nextElement = await FormElement.findById(formElement.nextElementId);

  // if previous and next is null, then delete the element
  if (!previousElement && !nextElement) {
    await FormElement.findByIdAndDelete(id);
    return formElement;
  }

  // if previous is exist and next is null, then this should be last node
  if (previousElement && !nextElement) {
    previousElement.nextElementId = null;
    await previousElement.save();
    await FormElement.findByIdAndDelete(id);

    return formElement;
  }

  // if previous is null and next is exist, then this should be head node
  if (!previousElement && nextElement) {
    nextElement.previousElementId = null;
    await nextElement.save();
    await FormElement.findByIdAndDelete(id);

    return formElement;
  }

  // if previous and next is exist, then linked list deletion
  if (previousElement && nextElement) {
    previousElement.nextElementId = nextElement._id as Schema.Types.ObjectId;
    nextElement.previousElementId = previousElement._id as Schema.Types.ObjectId;
    await previousElement.save();
    await nextElement.save();
    await FormElement.findByIdAndDelete(id);

    return formElement;
  }

  throw new BadRequestException("Element is in a bad state to delete.");
};

export const changeOrderFormElement = async (
  id: string,
  payload: { nextElementId: string; previousElementId: string }
) => {
  const formElement = await getFormElement(id);
  const { nextElementId, previousElementId } = payload;

  const newNextElement = nextElementId ? await FormElement.findById(nextElementId) : null;
  const newPreviousElement = previousElementId ? await FormElement.findById(previousElementId) : null;
  console.log({
    formElementNxtElementId: formElement.nextElementId,
    formElementPreviousElementId: formElement.previousElementId,
    nextElementId,
    previousElementId,
  });

  // If the element is already in the correct position, return it
  if (
    String(formElement.previousElementId) === (previousElementId ?? "null") &&
    String(formElement.nextElementId) === (nextElementId ?? "null")
  ) {
    return formElement;
  }

  // Detach the current element from its existing neighbors
  const currentPreviousElement = formElement.previousElementId
    ? await FormElement.findById(formElement.previousElementId)
    : null;
  const currentNextElement = formElement.nextElementId ? await FormElement.findById(formElement.nextElementId) : null;

  if (currentPreviousElement) {
    currentPreviousElement.nextElementId = (currentNextElement?._id as Schema.Types.ObjectId) || null;
    await currentPreviousElement.save();
  }
  if (currentNextElement) {
    currentNextElement.previousElementId = (currentPreviousElement?._id as Schema.Types.ObjectId) || null;
    await currentNextElement.save();
  }

  // Case 1: Both previous and next are null
  if (!newPreviousElement && !newNextElement) {
    formElement.previousElementId = null;
    formElement.nextElementId = null;
    await formElement.save();

    return formElement;
  }

  // Case 2: previous exists, next is null (becomes the last node)
  if (newPreviousElement && !newNextElement) {
    newPreviousElement.nextElementId = formElement._id as Schema.Types.ObjectId;
    await newPreviousElement.save();

    formElement.previousElementId = newPreviousElement._id as Schema.Types.ObjectId;
    formElement.nextElementId = null;
    await formElement.save();

    return formElement;
  }

  // Case 3: previous is null, next exists (becomes the head node)
  if (!newPreviousElement && newNextElement) {
    newNextElement.previousElementId = formElement._id as Schema.Types.ObjectId;
    await newNextElement.save();

    formElement.previousElementId = null;
    formElement.nextElementId = newNextElement._id as Schema.Types.ObjectId;
    await formElement.save();

    return formElement;
  }

  // Case 4: Both previous and next exist (insertion between nodes)
  if (newPreviousElement && newNextElement) {
    newPreviousElement.nextElementId = formElement._id as Schema.Types.ObjectId;
    newNextElement.previousElementId = formElement._id as Schema.Types.ObjectId;
    await newPreviousElement.save();
    await newNextElement.save();

    formElement.previousElementId = newPreviousElement._id as Schema.Types.ObjectId;
    formElement.nextElementId = newNextElement._id as Schema.Types.ObjectId;
    await formElement.save();

    return formElement;
  }

  throw new BadRequestException("Invalid form element order change.");
};
