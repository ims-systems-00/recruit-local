import { StatusCodes } from "http-status-codes";
import { ApiResponse, ControllerParams } from "../../../common/helper";
import * as metadataService from "./url-metadata.service";

export const getMetadata = async ({ req }: ControllerParams) => {
  const url = req.query.url as string;
  const metadata = await metadataService.getMetadata(url);

  return new ApiResponse({
    message: "URL metadata retrieved.",
    statusCode: StatusCodes.OK,
    data: metadata,
    fieldName: "metadata",
  });
};
