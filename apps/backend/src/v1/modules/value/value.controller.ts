import { StatusCodes } from "http-status-codes";
import { ApiResponse, ControllerParams } from "../../../common/helper";

const VALUES_DATA = [
  { _id: "1", type: "mindset", value: "Growth oriented" },
  { _id: "2", type: "mindset", value: "Problem solver" },
  { _id: "3", type: "working-style", value: "Collaborative" },
  { _id: "4", type: "working-style", value: "Independent" },
  { _id: "5", type: "culture", value: "Innovation" },
  { _id: "6", type: "culture", value: "Integrity" },
  { _id: "7", type: "mindset", value: "Adaptable" },
  { _id: "8", type: "mindset", value: "Curious" },
  { _id: "9", type: "mindset", value: "Resilient" },
  { _id: "10", type: "mindset", value: "Proactive" },
  { _id: "11", type: "mindset", value: "Data-driven" },
  { _id: "12", type: "mindset", value: "Empathetic" },
  { _id: "13", type: "mindset", value: "Detail-oriented" },
  { _id: "14", type: "mindset", value: "Continuous learner" },
  { _id: "15", type: "mindset", value: "Humble" },
  { _id: "16", type: "mindset", value: "Optimistic" },
  { _id: "17", type: "mindset", value: "Strategic thinker" },
  { _id: "18", type: "working-style", value: "Agile" },
  { _id: "19", type: "working-style", value: "Autonomous" },
  { _id: "20", type: "working-style", value: "Process-driven" },
  { _id: "21", type: "working-style", value: "Results-oriented" },
  { _id: "22", type: "working-style", value: "Cross-functional" },
  { _id: "23", type: "working-style", value: "Deep worker" },
  { _id: "24", type: "working-style", value: "Flexible" },
  { _id: "25", type: "working-style", value: "Highly communicative" },
  { _id: "26", type: "working-style", value: "Fast-paced" },
  { _id: "27", type: "working-style", value: "Structured" },
  { _id: "28", type: "working-style", value: "Remote-first" },
  { _id: "29", type: "culture", value: "Transparency" },
  { _id: "30", type: "culture", value: "Accountability" },
  { _id: "31", type: "culture", value: "Diversity & Inclusion" },
  { _id: "32", type: "culture", value: "Customer-centric" },
  { _id: "33", type: "culture", value: "Work-life balance" },
  { _id: "34", type: "culture", value: "Psychological safety" },
  { _id: "35", type: "culture", value: "Sustainability" },
  { _id: "36", type: "culture", value: "Excellence" },
  { _id: "37", type: "culture", value: "Mentorship" },
  { _id: "38", type: "culture", value: "Ownership" },
  { _id: "39", type: "culture", value: "Playful / Fun" },
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
