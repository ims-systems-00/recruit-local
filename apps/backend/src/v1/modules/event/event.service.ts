import { IListParams } from "@inrm/types";
import { NotFoundException } from "../../../common/helper";
import { EventInput, Event, IEventDoc } from "../../../models";
import { matchQuery, excludeDeletedQuery } from "../../../common/query";
import { eventProjectionQuery } from "./event.query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";

type IListEventParams = IListParams<EventInput>;

export const list = ({ query = {}, options }: IListEventParams) => {
  return Event.aggregatePaginate([...matchQuery(query), ...excludeDeletedQuery(), ...eventProjectionQuery()], options);
};

export const getOne = async (query = {}): Promise<IEventDoc> => {
  const event = await Event.aggregate([...matchQuery(query), ...excludeDeletedQuery(), ...eventProjectionQuery()]);
  if (event.length === 0) throw new NotFoundException("Event not found.");
  return event[0];
};

export const getSoftDeletedOne = async (query = {}) => {
  const event = await Event.aggregate([...matchQuery(query), ...eventProjectionQuery()]);
  if (event.length === 0) throw new NotFoundException("Event not found in trash.");
  return event[0];
};

export const create = async (payload: EventInput) => {
  let event = new Event(payload);
  event = await event.save();

  return event;
};

export const update = async (id: string, payload: Partial<EventInput>) => {
  const updatedEvent = await Event.findOneAndUpdate(
    { _id: id },
    {
      $set: { ...payload },
    },
    { new: true }
  );
  if (!updatedEvent) throw new NotFoundException("Event not found.");
  return updatedEvent;
};

export const softRemove = async (id: string) => {
  const event = await getOne({ ...sanitizeQueryIds({ _id: id }) });
  const { deleted } = await Event.softDelete({ _id: id });

  return { event, deleted };
};

export const hardRemove = async (id: string) => {
  const event = await getSoftDeletedOne({ ...sanitizeQueryIds({ _id: id }) });
  await Event.findOneAndDelete({ _id: id });

  return event;
};

export const restore = async (id: string) => {
  const { restored } = await Event.restore({ ...sanitizeQueryIds({ _id: id }) });
  if (!restored) throw new NotFoundException("Event not found in trash.");

  const event = await getOne({ ...sanitizeQueryIds({ _id: id }) });

  return { event, restored };
};
