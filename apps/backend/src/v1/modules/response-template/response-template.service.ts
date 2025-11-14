import { Schema } from "mongoose";
import { NotFoundException } from "../../../common/helper";
import { IListCoCParams } from "./response-template.interface";
import { ResponseTemplate, ResponseTemplateInput, IResponseTemplateDoc } from "../../../models";

const populates = [
  {
    path: "createdBy",
    select: "fullName email profileImageSrc",
  },
];

type PopulatedResponseTemplate = Omit<IResponseTemplateDoc, "createdBy"> & {
  createdBy: {
    _id: Schema.Types.ObjectId;
    fullName: string;
    email: string;
    profileImageSrc?: string;
  };
};

export const listResponseTemplate = ({ query = {}, options }: IListCoCParams) => {
  return ResponseTemplate.paginateAndExcludeDeleted(query, { ...options, populate: populates });
};

export const getResponseTemplate = async (id: string): Promise<PopulatedResponseTemplate> => {
  const responseTemplate = await ResponseTemplate.findOneWithExcludeDeleted({ _id: id });
  if (!responseTemplate) throw new NotFoundException("Response template not found.");
  return responseTemplate.populate(populates);
};

export const updateResponseTemplate = async (
  id: string,
  payload: Partial<ResponseTemplateInput>
): Promise<PopulatedResponseTemplate> => {
  await getResponseTemplate(id);

  const updatedResponseTemplate = await ResponseTemplate.findOneAndUpdate(
    { _id: id },
    {
      $set: { ...payload },
    },
    { new: true }
  );

  return updatedResponseTemplate.populate(populates);
};

export const createResponseTemplate = async (payload: ResponseTemplateInput): Promise<PopulatedResponseTemplate> => {
  let responseTemplate = new ResponseTemplate(payload);
  responseTemplate = await responseTemplate.save();

  return responseTemplate.populate(populates);
};

export const softRemoveResponseTemplate = async (id: string) => {
  const responseTemplate = await getResponseTemplate(id);
  const { deleted } = await ResponseTemplate.softDelete({ _id: id });

  return { responseTemplate, deleted };
};

export const hardRemoveResponseTemplate = async (id: string): Promise<PopulatedResponseTemplate> => {
  const responseTemplate = await getResponseTemplate(id);
  await ResponseTemplate.findByIdAndDelete(id);

  return responseTemplate;
};

export const restoreResponseTemplate = async (id: string) => {
  const { restored } = await ResponseTemplate.restore({ _id: id });
  if (!restored) throw new NotFoundException("Response template not found in trash.");

  const responseTemplate = await getResponseTemplate(id);
  return { responseTemplate, restored };
};
