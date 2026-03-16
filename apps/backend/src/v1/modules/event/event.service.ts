import { Types } from "mongoose";
import { IListParams, ListQueryParams, VISIBILITY_ENUM } from "@rl/types";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery, populateStatusQuery } from "../../../common/query";
import { NotFoundException } from "../../../common/helper";
import { EventInput, Event } from "../../../models";
import { eventProjectionQuery } from "./event.query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import * as StatusService from "../status/status.service";
import * as FileMediaService from "../file-media/file-media.service";
import { modelNames } from "../../../models/constants";
import { AwsStorageTemplate } from "../../../models/templates/aws-storage.template";

type IListEventParams = IListParams<EventInput>;
type IEventQueryParams = ListQueryParams<EventInput>;

export interface IEventUpdateParams {
  query: IEventQueryParams;
  payload: Partial<EventInput> & { bannerImageStorage?: AwsStorageTemplate };
}

export interface IEventGetParams {
  query: IEventQueryParams;
}

export interface IEventCreateParams {
  payload: EventInput & { bannerImageStorage?: AwsStorageTemplate };
}

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

export const getOne = async ({ query = {} }: IEventGetParams) => {
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

export const getOneSoftDeleted = async ({ query = {} }: IEventGetParams) => {
  const events = await Event.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...populateStatusQuery(),
    ...eventProjectionQuery(),
  ]);
  if (events.length === 0) throw new NotFoundException("Event not found in trash.");
  return events[0];
};

export const create = async ({ payload }: IEventCreateParams) => {
  const statusExists = await StatusService.getOne({ query: { _id: payload.statusId.toString() } });
  if (statusExists.collectionName !== modelNames.EVENT) {
    throw new NotFoundException("Status not found to associate with the event.");
  }

  const eventId = new Types.ObjectId();
  let bannerImageId = null;

  if (payload.bannerImageStorage) {
    const fileMedia = await FileMediaService.create({
      payload: {
        collectionName: modelNames.EVENT,
        collectionDocument: eventId,
        storageInformation: payload.bannerImageStorage,
        visibility: VISIBILITY_ENUM.PUBLIC,
      },
    });
    bannerImageId = fileMedia._id;
  }

  const { bannerImageStorage, ...cleanPayload } = payload;

  let event = new Event({
    ...cleanPayload,
    _id: eventId,
    bannerImageId: bannerImageId,
  });

  event = await event.save();
  return event;
};

export const update = async ({ query, payload }: IEventUpdateParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);

  if (payload.statusId) {
    const statusExists = await StatusService.getOne({ query: { _id: payload.statusId.toString() } });
    if (statusExists.collectionName !== modelNames.EVENT) {
      throw new NotFoundException("Status not found to associate with the event.");
    }
  }

  const event = await getOne({ query: sanitizedQuery });
  let updatedBannerImageId = event.bannerImageId;

  if (payload.bannerImageStorage) {
    const newFileMedia = await FileMediaService.create({
      payload: {
        collectionName: modelNames.EVENT,
        collectionDocument: event._id,
        storageInformation: payload.bannerImageStorage,
        visibility: VISIBILITY_ENUM.PUBLIC,
      },
    });

    updatedBannerImageId = newFileMedia._id;

    if (event.bannerImageId) {
      try {
        await FileMediaService.hardDelete({ query: { _id: event.bannerImageId.toString() } });
      } catch (error) {
        console.error(`Failed to delete old banner image ${event.bannerImageId} for Event ${event._id}`, error);
      }
    }
  }

  const { bannerImageStorage, ...cleanPayload } = payload;

  const updatedEvent = await Event.findOneAndUpdate(
    { _id: event._id },
    {
      $set: {
        ...cleanPayload,
        bannerImageId: updatedBannerImageId,
      },
    },
    { new: true }
  );

  if (!updatedEvent) throw new NotFoundException("Event not found.");
  return updatedEvent;
};

export const softDelete = async ({ query }: IEventGetParams) => {
  const { deleted } = await Event.softDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("Event not found to delete.");
  const result = await getOneSoftDeleted({ query: sanitizeQueryIds(query) });
  return result;
};

export const hardDelete = async ({ query }: IEventGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const event = await getOneSoftDeleted({ query: sanitizedQuery });

  if (event.bannerImageId) {
    try {
      await FileMediaService.hardDelete({ query: { _id: event.bannerImageId.toString() } });
    } catch (error) {
      console.error("Failed to delete attached banner image for Event:", error);
    }
  }

  const deletedEvent = await Event.findOneAndDelete({ _id: event._id });
  if (!deletedEvent) throw new NotFoundException("Event not found to delete.");
  return event;
};

export const restore = async ({ query }: IEventGetParams) => {
  const { restored } = await Event.restore(sanitizeQueryIds(query));
  if (!restored) throw new NotFoundException("Event not found in trash.");
  const result = await getOne({ query: sanitizeQueryIds(query) });
  return result;
};
