import { IListParams } from "@inrm/types";
import { NotFoundException } from "../../../common/helper";
import { EventInput, Event } from "../../../models";

type IListEventParams = IListParams<EventInput>;

export const list = ({ query = {}, options }: IListEventParams) => {
  return Event.paginateAndExcludeDeleted(query, { ...options, sort: { createdAt: -1 } });
};

export const getOne = async (id: string) => {
  const event = await Event.findOneWithExcludeDeleted({ _id: id });
  if (!event) throw new NotFoundException("Event not found.");
  return event;
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
  const event = await getOne(id);
  const { deleted } = await Event.softDelete({ _id: id });

  return { event, deleted };
};

export const hardRemove = async (id: string) => {
  const event = await getOne(id);
  await Event.findOneAndDelete({ _id: id });

  return event;
};

export const restore = async (id: string) => {
  const { restored } = await Event.restore({ _id: id });
  if (!restored) throw new NotFoundException("Event not found in trash.");

  const event = await getOne(id);

  return { event, restored };
};
