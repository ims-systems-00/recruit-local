import { IOptions } from "@rl/types";
import { NotificationInput } from "../../../models";

// The list builder composes an `$and` of the filter and any extra conditions, so
// this is wider than the document shape.
export type Query = Partial<NotificationInput & { _id: string }> & Record<string, unknown>;

export interface IListNotificationParams {
  query: Query;
  options?: IOptions;
  offset?: number;
}
