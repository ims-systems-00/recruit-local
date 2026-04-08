import { Location, ILocationDoc } from "../../../models";
import { NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { locationProjectQuery } from "./location.query";
import {
  IListLocationParams,
  ILocationGetParams,
  ILocationUpdateParams,
  ILocationCreateParams,
} from "./location.interface";

/**
 * List active locations with pagination
 */
export const list = ({ query = {}, options, session }: IListLocationParams) => {
  const aggregate = Location.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...locationProjectQuery(),
  ]);

  if (session) aggregate.session(session);

  return Location.aggregatePaginate(aggregate, options);
};

/**
 * Get a single active location
 */
export const getOne = async ({ query = {}, session }: ILocationGetParams): Promise<ILocationDoc> => {
  const aggregate = Location.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...locationProjectQuery(),
  ]);

  if (session) aggregate.session(session);

  const locations = await aggregate;

  if (locations.length === 0) throw new NotFoundException("Location not found.");
  return locations[0] as unknown as ILocationDoc;
};

/**
 * List soft-deleted locations with pagination
 */
export const listSoftDeleted = ({ query = {}, options, session }: IListLocationParams) => {
  const aggregate = Location.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...locationProjectQuery(),
  ]);

  if (session) aggregate.session(session);

  return Location.aggregatePaginate(aggregate, options);
};

/**
 * Get a single soft-deleted location
 */
export const getOneSoftDeleted = async ({ query = {}, session }: ILocationGetParams): Promise<ILocationDoc> => {
  const aggregate = Location.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...locationProjectQuery(),
  ]);

  if (session) aggregate.session(session);

  const locations = await aggregate;

  if (locations.length === 0) throw new NotFoundException("Location not found in trash.");
  return locations[0] as unknown as ILocationDoc;
};

/**
 * Create a new location
 */
export const create = async ({ payload, session }: ILocationCreateParams) => {
  // Geocoding happens automatically via the pre('validate') hook on the Location schema
  let location = new Location(payload);

  location = await location.save({ session });

  return location;
};

/**
 * Update an existing location
 */
export const update = async ({ query, payload, session }: ILocationUpdateParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const location = await getOne({ query: sanitizedQuery, session });

  // Geocoding happens automatically via the pre('findOneAndUpdate') hook on the Location schema
  const updatedLocation = await Location.findOneAndUpdate(
    { _id: location._id },
    { $set: payload },
    { new: true, session }
  );

  if (!updatedLocation) throw new NotFoundException("Location not found.");
  return updatedLocation;
};

/**
 * Soft delete a location
 */
export const softDelete = async ({ query, session }: ILocationGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const location = await getOne({ query: sanitizedQuery, session });

  const { deleted } = await Location.softDelete({ _id: location._id }, { session });

  if (!deleted) throw new NotFoundException("Location not found to delete.");
  return { deleted };
};

/**
 * Hard delete a location completely from the database
 */
export const hardDelete = async ({ query, session }: ILocationGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const location = await getOneSoftDeleted({ query: sanitizedQuery, session });

  const deletedLocation = await Location.findOneAndDelete({ _id: location._id }, { session });

  if (!deletedLocation) throw new NotFoundException("Location not found to delete.");
  return deletedLocation;
};

/**
 * Restore a soft-deleted location
 */
export const restore = async ({ query, session }: ILocationGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);

  const { restored } = await Location.restore(sanitizedQuery, { session });

  if (!restored) throw new NotFoundException("Location not found in trash.");

  return getOne({ query: sanitizedQuery, session });
};
