import NodeGeocoder, { Options } from "node-geocoder";
import { pick } from "./pick";
import { logger } from "./logger";

interface IResults {
  docs: any[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page?: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage?: number;
  nextPage?: number;
}

export const formatListResponse = (results: IResults) => {
  const { docs: data, ...paginationOption } = results;
  const pagination = pick(paginationOption, [
    "totalDocs",
    "limit",
    "totalPages",
    "page",
    "pagingCounter",
    "hasPrevPage",
    "hasNextPage",
    "prevPage",
    "nextPage",
  ]);

  return {
    data,
    pagination,
  };
};

type QueryData = {
  page?: string | number;
  limit?: string | number;
  [key: string]: any;
};

export const trimQuery = (queryData: QueryData): QueryData => {
  let { page, limit } = queryData;

  const pageNumber = parseInt(String(page));
  const pageSize = parseInt(String(limit));

  page = !pageNumber || pageNumber < 1 ? 1 : pageNumber;
  if (!pageSize) limit = 30;
  if (pageSize < 1) limit = 1;
  if (pageSize > 100) limit = 100;

  const isObject = (object: any): boolean => object !== null && typeof object === "object";

  function deepTrim(obj: any): any {
    const keys = Object.keys(obj);
    for (let key of keys) {
      if (isObject(obj[key])) {
        deepTrim(obj[key]);
      } else {
        obj[key] = obj[key] === "null" ? null : obj[key];
        obj[key] = obj[key] === "undefined" ? undefined : obj[key];
      }
    }
    return obj;
  }

  if (queryData.page && queryData.limit) {
    return { ...deepTrim(queryData), page, limit };
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
