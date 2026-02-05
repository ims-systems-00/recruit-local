import { IListParams, ListQueryParams } from "@rl/types";
import { NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery, populateStatusQuery } from "../../../common/query";
import { eventRegistrationProjectionQuery } from "./event-registration.query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { EventRegistrationInput, EventRegistration } from "../../../models";
import { getOne as getAEvent } from "../event/event.service";
import * as StatusService from "../status/status.service";
import { modelNames } from "../../../models/constants";

type IListEventRegistrationParams = IListParams<EventRegistrationInput>;
type IEventRegistrationQueryParams = ListQueryParams<EventRegistrationInput>;

export const list = ({ query = {}, options }: IListEventRegistrationParams) => {
  return EventRegistration.aggregatePaginate(
    [
      ...matchQuery(sanitizeQueryIds(query)),
      ...excludeDeletedQuery(),
      ...populateStatusQuery(),
      ...eventRegistrationProjectionQuery(),
    ],
    options
  );
};

export const getOne = async ({ query = {} }: IListEventRegistrationParams) => {
  const eventRegistrations = await EventRegistration.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...populateStatusQuery(),
    ...eventRegistrationProjectionQuery(),
  ]);
  if (eventRegistrations.length === 0) throw new NotFoundException("Event Registration not found.");
  return eventRegistrations[0];
};

export const listSoftDeleted = async ({ query = {}, options }: IListEventRegistrationParams) => {
  return EventRegistration.aggregatePaginate(
    [
      ...matchQuery(sanitizeQueryIds(query)),
      ...onlyDeletedQuery(),
      ...populateStatusQuery(),
      ...eventRegistrationProjectionQuery(),
    ],
    options
  );
};

export const getOneSoftDeleted = async ({ query = {} }: IListEventRegistrationParams) => {
  const eventRegistrations = await EventRegistration.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...populateStatusQuery(),
    ...eventRegistrationProjectionQuery(),
  ]);
  if (eventRegistrations.length === 0) throw new NotFoundException("Event Registration not found in trash.");
  return eventRegistrations[0];
};

export const create = async (payload: EventRegistrationInput) => {
  const statusExists = await StatusService.getOne({
    query: { collectionName: modelNames.EVENT_REGISTRATION, label: "pending" },
  });
  payload.statusId = statusExists._id as unknown as typeof payload.statusId;
  // Uses the standardized signature from your Event service
  const event = await getAEvent({ query: { _id: payload.eventId } });

  // Ensure date comparison is safe
  if (new Date(event.registrationEndDate) < new Date()) {
    throw new Error(`Event ${event.title} is not open for registration.`);
  }

  let eventRegistration = new EventRegistration(payload);
  eventRegistration = await eventRegistration.save();
  return eventRegistration;
};

export const update = async ({
  query,
  payload,
}: {
  query: IEventRegistrationQueryParams;
  payload: Partial<EventRegistrationInput>;
}) => {
  if (payload.statusId) {
    const statusExists = await StatusService.getOne({ query: { _id: payload.statusId } });
    if (statusExists.collectionName !== modelNames.EVENT_REGISTRATION)
      throw new NotFoundException("Status not found to associate with the event registration.");
  }
  const updatedEventRegistration = await EventRegistration.findOneAndUpdate(
    sanitizeQueryIds(query),
    { $set: payload },
    { new: true }
  );
  if (!updatedEventRegistration) throw new NotFoundException("Event Registration not found.");
  return updatedEventRegistration;
};

export const softRemove = async ({ query }: { query: IEventRegistrationQueryParams }) => {
  const { deleted } = await EventRegistration.softDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("Event Registration not found to delete.");
  return { deleted };
};

export const hardRemove = async ({ query }: { query: IEventRegistrationQueryParams }) => {
  const deletedRegistration = await EventRegistration.findOneAndDelete(sanitizeQueryIds(query));
  if (!deletedRegistration) throw new NotFoundException("Event Registration not found to delete.");
  return deletedRegistration;
};

export const restore = async ({ query }: { query: IEventRegistrationQueryParams }) => {
  const { restored } = await EventRegistration.restore(sanitizeQueryIds(query));
  if (!restored) throw new NotFoundException("Event Registration not found in trash.");
  return { restored };
};
