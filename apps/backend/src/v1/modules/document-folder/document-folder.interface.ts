import { DocumentFolderInput } from "../../../models";

export type Query = Partial<DocumentFolderInput & { _id: string }>;

export interface IOptions {
  page?: number;
  limit?: number;
}

export interface IListDocumentFolderParams {
  query: Query;
  options?: IOptions;
}
