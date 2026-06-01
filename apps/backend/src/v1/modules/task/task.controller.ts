import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import * as taskService from "./task.service";
import { ApiResponse, ControllerParams, formatListResponse } from "../../../common/helper";
import { TaskAssignedEmail } from "../email/task-assigned.email";
import { TASK_STATUS_ENUMS } from "../../../models/constants";

export const listTask = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["title"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const results = await taskService.listTask({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Tasks retrieved.",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "tasks",
    pagination,
  });
};

export const getTask = async ({ req }: ControllerParams) => {
  const task = await taskService.getTask(req.params.id);

  return new ApiResponse({
    message: "Task retrieved.",
    statusCode: StatusCodes.OK,
    data: task,
    fieldName: "task",
  });
};

export const updateTask = async ({ req }: ControllerParams) => {
  const task = await taskService.updateTask(req.params.id, req.body);

  return new ApiResponse({
    message: "Task updated.",
    statusCode: StatusCodes.OK,
    data: task,
    fieldName: "task",
  });
};

export const createTask = async ({ req }: ControllerParams) => {
  const payload = { ...req.body, createdBy: req.session.user?._id };
  const task = await taskService.createTask(payload);
  if (task.assignedTo?.length && task.status !== TASK_STATUS_ENUMS.DRAFT) {
    task.assignedTo.forEach((user) => {
      const email = new TaskAssignedEmail({
        assignerName: req.session.user?.fullName,
        reference: task._id.toString(),
        taskLink: `${process.env.CLIENT_URL}/tasks?_id=${task._id}`,
        taskTitle: task.title,
      });
      email.to(user.email).send();
    });
  }
  return new ApiResponse({
    message: "Task created.",
    statusCode: StatusCodes.CREATED,
    data: task,
    fieldName: "task",
  });
};

export const softRemoveTask = async ({ req }: ControllerParams) => {
  const { task, deleted } = await taskService.softRemoveTask(req.params.id);

  return new ApiResponse({
    message: `${deleted} task moved to trash.`,
    statusCode: StatusCodes.OK,
    data: task,
    fieldName: "task",
  });
};

export const hardRemoveTask = async ({ req }: ControllerParams) => {
  const task = await taskService.hardRemoveTask(req.params.id);

  return new ApiResponse({
    message: "Task removed.",
    statusCode: StatusCodes.OK,
    data: task,
    fieldName: "task",
  });
};

export const restoreTask = async ({ req }: ControllerParams) => {
  const { task, restored } = await taskService.restoreTask(req.params.id);

  return new ApiResponse({
    message: `${restored} task restored.`,
    statusCode: StatusCodes.OK,
    data: task,
    fieldName: "task",
  });
};

export const createTaskSubResource = async ({ req }: ControllerParams) => {
  const subResource = req.params["subResource"];
  const task = await taskService.createTaskSubResource(req.params.id, subResource, req.body);
  return new ApiResponse({
    message: `${subResource} added to task.`,
    statusCode: StatusCodes.CREATED,
    data: task,
    fieldName: "task",
  });
};

export const removeTaskSubResource = async ({ req }: ControllerParams) => {
  const subResource = req.params["subResource"];
  const subResourceId = req.params["subResourceId"];
  const task = await taskService.removeTaskSubResource(req.params.id, subResource, subResourceId);

  return new ApiResponse({
    message: `${subResource} removed from task.`,
    statusCode: StatusCodes.OK,
    data: task,
    fieldName: "task",
  });
};
