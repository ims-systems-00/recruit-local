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
  { _id: "40", type: "motivation", value: "Career growth" },
  { _id: "41", type: "motivation", value: "Making an impact" },
  { _id: "42", type: "motivation", value: "Autonomy" },
  { _id: "43", type: "motivation", value: "Recognition" },
  { _id: "44", type: "motivation", value: "Financial security" },
  { _id: "45", type: "motivation", value: "Creative expression" },
  { _id: "46", type: "motivation", value: "Social purpose" },
  { _id: "47", type: "motivation", value: "Learning & mastery" },
  { _id: "48", type: "motivation", value: "Work-life harmony" },
  { _id: "49", type: "motivation", value: "Job security" },
  { _id: "50", type: "motivation", value: "Building great products" },
  { _id: "51", type: "motivation", value: "Helping others" },
  { _id: "52", type: "leadership", value: "Servant leader" },
  { _id: "53", type: "leadership", value: "Visionary" },
  { _id: "54", type: "leadership", value: "Coach & mentor" },
  { _id: "55", type: "leadership", value: "Lead by example" },
  { _id: "56", type: "leadership", value: "Collaborative leader" },
  { _id: "57", type: "leadership", value: "Decisive" },
  { _id: "58", type: "leadership", value: "Empowering" },
  { _id: "59", type: "leadership", value: "Strategic" },
  { _id: "60", type: "leadership", value: "Inclusive leader" },
  { _id: "61", type: "communication", value: "Direct & concise" },
  { _id: "62", type: "communication", value: "Thoughtful & thorough" },
  { _id: "63", type: "communication", value: "Active listener" },
  { _id: "64", type: "communication", value: "Transparent" },
  { _id: "65", type: "communication", value: "Written-first" },
  { _id: "66", type: "communication", value: "Verbal / synchronous" },
  { _id: "67", type: "communication", value: "Inclusive communicator" },
  { _id: "68", type: "communication", value: "Diplomatic" },
  { _id: "69", type: "impact", value: "Solving hard problems" },
  { _id: "70", type: "impact", value: "Advancing technology" },
  { _id: "71", type: "impact", value: "Environmental sustainability" },
  { _id: "72", type: "impact", value: "Social equity" },
  { _id: "73", type: "impact", value: "Building businesses" },
  { _id: "74", type: "impact", value: "Improving healthcare" },
  { _id: "75", type: "impact", value: "Democratizing access" },
  { _id: "76", type: "impact", value: "Creating economic opportunity" },
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
