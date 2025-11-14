import { NotFoundException } from "../../../../common/helper";
import { IListFormParams } from "./form.interface";
import { Form, FormInput, IFormDoc } from "../../../../models";

export const listForm = ({ query = {}, options }: IListFormParams) => {
  return Form.paginateAndExcludeDeleted(query, { ...options, sort: { createdAt: -1 } });
};

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
