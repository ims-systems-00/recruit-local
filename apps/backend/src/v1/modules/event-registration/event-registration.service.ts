import { EVENT_STATUS_ENUMS, IListParams } from "@inrm/types";
import { NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery } from "../../../common/query";
import { eventRegistrationProjectionQuery } from "./event-registration.query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { EventRegistrationInput, EventRegistration } from "../../../models";
import { getOne as getAEvent } from "../event/event.service";

type IListEventRegistrationParams = IListParams<EventRegistrationInput>;

export const list = ({ query = {}, options }: IListEventRegistrationParams) => {
  return EventRegistration.aggregatePaginate(
    [...matchQuery(query), ...excludeDeletedQuery(), ...eventRegistrationProjectionQuery()],
    options
  );
};

export const getOne = async (query = {}) => {
  const eventRegistration = await EventRegistration.aggregate([
    ...matchQuery(query),
    ...excludeDeletedQuery(),
    ...eventRegistrationProjectionQuery(),
  ]);
  if (eventRegistration.length === 0) throw new NotFoundException("Event Registration not found.");
  return eventRegistration[0];
};

export const getSoftDeletedOne = async (query = {}) => {
  const eventRegistration = await EventRegistration.aggregate([
    ...matchQuery(query),
    ...eventRegistrationProjectionQuery(),
  ]);
  if (eventRegistration.length === 0) throw new NotFoundException("Event Registration not found in trash.");
  return eventRegistration[0];
};

export const create = async (payload: EventRegistrationInput) => {
  const event = await getAEvent({
    ...sanitizeQueryIds({ _id: payload.eventId }),
  });

  if (event.status !== EVENT_STATUS_ENUMS.UPCOMING && event.registrationEndDate < new Date()) {
    throw new Error(`Event ${event.title} is not open for registration.`);
  }

  let eventRegistration = new EventRegistration(payload);
  eventRegistration = await eventRegistration.save();

  return eventRegistration;
};

export const update = async (id: string, payload: Partial<EventRegistrationInput>) => {
  const updatedEventRegistration = await EventRegistration.findOneAndUpdate(
    { _id: id },
    {
      $set: { ...payload },
    },
    { new: true }
  );
  if (!updatedEventRegistration) throw new NotFoundException("Event Registration not found.");
  return updatedEventRegistration;
};

export const softRemove = async (id: string) => {
  const { deleted } = await EventRegistration.softDelete({ _id: id });
  return { deleted };
};

export const hardRemove = async (id: string) => {
  const eventRegistration = await EventRegistration.findOneAndDelete({ _id: id });
  return eventRegistration;
};

export const restore = async (id: string) => {
  const { restored } = await EventRegistration.restore({ ...sanitizeQueryIds({ _id: id }) });
  return restored;
};
