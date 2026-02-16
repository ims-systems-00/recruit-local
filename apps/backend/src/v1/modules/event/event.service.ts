import { IListParams, ListQueryParams } from "@rl/types";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery, populateStatusQuery } from "../../../common/query";
import { NotFoundException } from "../../../common/helper";
import { EventInput, Event } from "../../../models";
import { eventProjectionQuery } from "./event.query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import * as StatusService from "../status/status.service";
import { modelNames } from "../../../models/constants";

type IListEventParams = IListParams<EventInput>;
type IEventQueryParams = ListQueryParams<EventInput>;

export const list = ({ query = {}, options }: IListEventParams) => {
  return Event.aggregatePaginate(
    [
      ...matchQuery(sanitizeQueryIds(query)),
      ...excludeDeletedQuery(),
      ...populateStatusQuery(),
      ...eventProjectionQuery(),
    ],
    options
  );
};

export const getOne = async ({ query = {} }: IEventQueryParams) => {
  const events = await Event.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...populateStatusQuery(),
    ...eventProjectionQuery(),
  ]);
  if (events.length === 0) throw new NotFoundException("Event not found.");
  return events[0];
};

export const listSoftDeleted = async ({ query = {}, options }: IListEventParams) => {
  return Event.aggregatePaginate(
    [
      ...matchQuery(sanitizeQueryIds(query)),
      ...onlyDeletedQuery(),
      ...populateStatusQuery(),
      ...eventProjectionQuery(),
    ],
    options
  );
};

export const getOneSoftDeleted = async ({ query = {} }: IListEventParams) => {
  const events = await Event.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...populateStatusQuery(),
    ...eventProjectionQuery(),
  ]);
  if (events.length === 0) throw new NotFoundException("Event not found in trash.");
  return events[0];
};

export const create = async (payload: EventInput) => {
  const statusExists = await StatusService.getOne({ query: { _id: payload.statusId } });
  if (statusExists.collectionName !== modelNames.EVENT)
    throw new NotFoundException("Status not found to associate with the event.");
  let event = new Event(payload);
  event = await event.save();
  return event;
};

export const update = async ({ query, payload }: { query: IEventQueryParams; payload: Partial<EventInput> }) => {
  if (payload.statusId) {
    const statusExists = await StatusService.getOne({ query: { _id: payload.statusId } });
    if (statusExists.collectionName !== modelNames.EVENT)
      throw new NotFoundException("Status not found to associate with the event.");
  }
  const updatedEvent = await Event.findOneAndUpdate(sanitizeQueryIds(query), { $set: payload }, { new: true });
  if (!updatedEvent) throw new NotFoundException("Event not found.");
  return updatedEvent;
};

export const softRemove = async ({ query }: { query: IEventQueryParams }) => {
  const { deleted } = await Event.softDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("Event not found to delete.");
  return { deleted };
};

export const hardRemove = async ({ query }: { query: IEventQueryParams }) => {
  const deletedEvent = await Event.findOneAndDelete(sanitizeQueryIds(query));
  if (!deletedEvent) throw new NotFoundException("Event not found to delete.");
  return deletedEvent;
};

export const restore = async ({ query }: { query: IEventQueryParams }) => {
  const { restored } = await Event.restore(sanitizeQueryIds(query));
  if (!restored) throw new NotFoundException("Event not found in trash.");
  return { restored };
};
