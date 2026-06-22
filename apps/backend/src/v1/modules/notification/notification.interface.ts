import { NotificationInput } from "../../../models";

export type Query = Partial<NotificationInput & { _id: string }>;

export interface IOptions {
  page?: number;
  limit?: number;
}

export interface IListNotificationParams {
  query: Query;
  options?: IOptions;
}
