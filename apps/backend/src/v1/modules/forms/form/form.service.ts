import { NotFoundException } from "../../../../common/helper";
import { cursorSortStage, toCursorPage } from "../../../../common/query";
import { IListFormParams } from "./form.interface";
import { Form, FormInput, IFormDoc } from "../../../../models";

export const listForm = async ({ query = {}, options, offset = 0 }: IListFormParams) => {
  const limit = options?.limit && options.limit > 0 ? options.limit : 10;
  const sort = options?.sort ? String(options.sort) : "-createdAt";

  // `find` rather than the paginate helper: one extra document is the whole
  // `hasNextPage` answer, so there is no $count branch to run.
  const docs = await Form.find({ $and: [query, { "deleteMarker.status": { $ne: true } }] })
    .sort(cursorSortStage(sort))
    .skip(offset)
    .limit(limit + 1)
    .lean();

  return toCursorPage(docs, limit);
};

/** How many match, ignoring paging. Only the legacy `?page=` branch needs this. */
export const countForm = ({ query = {} }: IListFormParams) =>
  Form.countDocuments({ $and: [query, { "deleteMarker.status": { $ne: true } }] });

export const getForm = async (id: string) => {
  const form = await Form.findOneWithExcludeDeleted({ _id: id });
  if (!form) throw new NotFoundException("Form not found.");

  return form;
};

export const updateForm = async (id: string, payload: Partial<IFormDoc>) => {
  await getForm(id);
  const updatedForm = await Form.findOneAndUpdate(
    { _id: id },
    {
      $set: { ...payload },
    },
    { new: true }
  );

  return updatedForm;
};

export const createForm = (payload: FormInput) => {
  const form = new Form(payload);
  return form.save();
};

export const softRemoveForm = async (id: string) => {
  const form = await getForm(id);
  const { deleted } = await Form.softDelete({ _id: id });

  return { form, deleted };
};

export const hardRemoveForm = async (id: string) => {
  const form = await getForm(id);
  await Form.findOneAndDelete({ _id: id });

  return form;
};

export const restoreForm = async (id: string) => {
  const { restored } = await Form.restore({ _id: id });
  if (!restored) throw new NotFoundException("Form not found in trash.");

  const form = await getForm(id);

  return { form, restored };
};
