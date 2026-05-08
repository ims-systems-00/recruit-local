import { StatusCodes } from "http-status-codes";
import { ApiResponse, ControllerParams } from "../../../common/helper";

const VALUES_DATA = [
  { _id: "1", type: "mindset", value: "Growth oriented" },
  { _id: "2", type: "mindset", value: "Problem solver" },
  { _id: "3", type: "working-style", value: "Collaborative" },
  { _id: "4", type: "working-style", value: "Independent" },
  { _id: "5", type: "culture", value: "Innovation" },
  { _id: "6", type: "culture", value: "Integrity" },
];

export const list = async ({ req }: ControllerParams) => {
  const { type } = req.query;

  let data = VALUES_DATA;

  if (type) {
    data = VALUES_DATA.filter((v) => v.type === type);
  }

  return new ApiResponse({
    message: "Values retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "values",
  });
};

export const get = async ({ req }: ControllerParams) => {
  const value = VALUES_DATA.find((v) => v._id === req.params.id);

  if (!value) {
    return new ApiResponse({
      message: "Value not found",
      statusCode: StatusCodes.NOT_FOUND,
      data: null,
      fieldName: "value",
    });
  }

  return new ApiResponse({
    message: "Value retrieved",
    statusCode: StatusCodes.OK,
    data: value,
    fieldName: "value",
  });
};
