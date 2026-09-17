import NodeGeocoder, { Options } from "node-geocoder";
import { pick } from "./pick";
import { logger } from "./logger";

interface ICursorResults {
  docs: any[];
  limit: number;
  hasNextPage: boolean;
  nextCursor?: string | null;
}

/**
 * Shapes a cursor page into the `{ data, pagination }` envelope. There is no
 * `totalDocs`: skipping the `$count` branch is the point of paging this way.
 */
export const formatCursorListResponse = (results: ICursorResults) => {
  const { docs: data, ...paginationOption } = results;
  const pagination = pick(paginationOption, ["limit", "hasNextPage", "nextCursor"]);

  return {
    data,
    pagination,
  };
};

type QueryData = {
  limit?: string | number;
  [key: string]: any;
};

/**
 * Normalizes `"null"` / `"undefined"` string literals to real values, recursively.
 *
 * It used to clamp `page` and `limit` and write them back onto the query. Paging
 * is by cursor now, and `buildListQuery` already clamps `limit` against the
 * module's own bounds, so this only does the deep trim.
 */
export const trimQuery = (queryData: QueryData): QueryData => {
  const isObject = (object: any): boolean => object !== null && typeof object === "object";

  function deepTrim(obj: any): any {
    const keys = Object.keys(obj);
    for (const key of keys) {
      if (isObject(obj[key])) {
        deepTrim(obj[key]);
      } else {
        obj[key] = obj[key] === "null" ? null : obj[key];
        obj[key] = obj[key] === "undefined" ? undefined : obj[key];
      }
    }
    return obj;
  }

  return { ...deepTrim(queryData) };
};

const options: Options = {
  provider: "google",
  apiKey: process.env.GOOGLE_API_KEY,
  formatter: null,
};

const geocoder = NodeGeocoder(options);

export const getGeoLocationFromAddress = async (address: string) => {
  try {
    const res = await geocoder.geocode(address);
    return res;
  } catch (err) {
    logger.error("geocode error: ", err);
    return [];
  }
};
