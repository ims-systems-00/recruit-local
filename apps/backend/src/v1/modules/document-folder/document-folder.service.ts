import { NotFoundException } from "../../../common/helper";
import { IListDocumentFolderParams } from "./document-folder.interface";
import { DocumentFolder, DocumentFolderInput } from "../../../models";
import { DOCUMENT_FOLDER_TYPE_ENUMS } from "../../../models/constants";

const populates = [
  {
    path: "parentId",
    select: "name description type ownedBy",
  },
  {
    path: "ownedBy",
    select: "fullName email",
  },
  {
    path: "createdBy",
    select: "fullName email",
  },
];

// Function to check if parentId is a folder
const validateParentFolder = async (parentId?: string) => {
  if (parentId) {
    const parentFolder = await getDocumentFolder(parentId);
    if (parentFolder.type !== DOCUMENT_FOLDER_TYPE_ENUMS.FOLDER) {
      throw new NotFoundException("Parent id must be a folder.");
    }
  }
};

export const listDocumentFolder = ({ query = {}, options }: IListDocumentFolderParams) => {
  return DocumentFolder.paginateAndExcludeDeleted(query, { ...options, populate: populates });
};

export const getDocumentFolder = async (id: string) => {
  const documentFolder = await DocumentFolder.findOneWithExcludeDeleted({ _id: id });
  if (!documentFolder) throw new NotFoundException("Document and folder not found.");

  return documentFolder.populate(populates);
};

export const updateDocumentFolder = async (id: string, payload: Partial<DocumentFolderInput>) => {
  await getDocumentFolder(id);
  await validateParentFolder(payload.parentId?.toString());

  const updatedDocumentFolder = await DocumentFolder.findOneAndUpdate(
    { _id: id },
    {
      $set: { ...payload },
    },
    { new: true }
  );

  return updatedDocumentFolder.populate(populates);
};

export const createDocumentFolder = async (payload: DocumentFolderInput) => {
  await validateParentFolder(payload.parentId?.toString());

  let documentFolder = new DocumentFolder(payload);
  documentFolder = await documentFolder.save();

  return documentFolder.populate(populates);
};

export const softRemoveDocumentFolder = async (id: string) => {
  const documentFolder = await getDocumentFolder(id);
  const { deleted } = await DocumentFolder.softDelete({ _id: id });

  return { documentFolder, deleted };
};

export const hardRemoveDocumentFolder = async (id: string) => {
  const documentFolder = await getDocumentFolder(id);
  await DocumentFolder.findOneAndDelete({ _id: id });

  return documentFolder;
};

export const restoreDocumentFolder = async (id: string) => {
  const { restored } = await DocumentFolder.restore({ _id: id });
  if (!restored) throw new NotFoundException("Document and folder not found in trash.");

  const documentFolder = await getDocumentFolder(id);

  return { documentFolder, restored };
};
