import { BadRequestException, NotFoundException } from "../../../common/helper";
import { IListTaskParams } from "./task.interface";
import { Task, TaskInput, ITaskDoc } from "../../../models";
import { TASK_STATUS_ENUMS } from "../../../models/constants";
import { Types } from "mongoose";

interface PopulatedUser {
  _id: Types.ObjectId;
  email: string;
  fullName: string;
  profileImageSrc?: string;
}

interface TaskWithPopulatedUsers extends Omit<ITaskDoc, "assignedTo"> {
  assignedTo: PopulatedUser[];
}

const populates = [
  {
    path: "tenantId",
    select: "name industry size phone officeEmail",
  },
  // {
  //   path: "auditId",
  //   select: "title",
  // },
  {
    path: "assignedTo",
    select: "fullName email profileImageSrc",
  },
  {
    path: "duplicatedTask",
    select: "title",
  },
  {
    path: "relatedTask",
    select: "title",
  },
  // {
  //   path: "relatedAudit",
  //   select: "title",
  // },
  {
    path: "relatedOrganisation",
    select: "name",
  },
  // {
  //   path: "relatedQuotation",
  //   select: "title",
  // },
  {
    path: "createdBy",
    select: "fullName email profileImageSrc",
  },
  // {
  //   path: "category",
  //   select: "labelText description color",
  // },
];

const isTaskCompleted = (status: string) => {
  if (status === TASK_STATUS_ENUMS.COMPLETED) {
    throw new BadRequestException("Task is already completed.");
  }
};

export const listTask = ({ query = {}, options }: IListTaskParams) => {
  return Task.paginateAndExcludeDeleted(query, { ...options, sort: { createdAt: -1 }, populate: populates });
};

export const getTask = async (id: string) => {
  const task = await Task.findOneWithExcludeDeleted({ _id: id });
  if (!task) throw new NotFoundException("Task not found.");

  return task.populate(populates);
};

export const updateTask = async (id: string, payload: Partial<TaskInput>) => {
  const task = await getTask(id);
  isTaskCompleted(task.status);

  const updatedTask = await Task.findOneAndUpdate({ _id: id }, payload, { new: true });
  return updatedTask.populate(populates);
};

export const createTask = async (payload: TaskInput) => {
  let task = new Task(payload);
  task = await task.save();
  const populatedTask = (await task.populate("assignedTo")) as unknown as TaskWithPopulatedUsers;
  return populatedTask;
};

export const softRemoveTask = async (id: string) => {
  const task = await getTask(id);
  const { deleted } = await Task.softDelete({ _id: id });

  return { task, deleted };
};

export const hardRemoveTask = async (id: string) => {
  const task = await getTask(id);
  await Task.findOneAndDelete({ _id: id });

  return task;
};

export const restoreTask = async (id: string) => {
  const { restored } = await Task.restore({ _id: id });
  if (!restored) throw new NotFoundException("Task not found in trash.");

  const task = await getTask(id);

  return { task, restored };
};

export const createTaskSubResource = async (id: string, subResource: string, payload: { items: string[] }) => {
  const task = await getTask(id);
  isTaskCompleted(task.status);

  const updatedTask = await Task.findOneAndUpdate(
    { _id: id },
    { $addToSet: { [subResource]: { $each: payload.items } } },
    { new: true }
  );

  const populatedTask = (await updatedTask.populate(populates)) as unknown as TaskWithPopulatedUsers;

  return {
    newResource: [],
    task: populatedTask,
  };
};

export const removeTaskSubResource = async (id: string, subResource: string, subResourceId: string) => {
  const task = await getTask(id);
  isTaskCompleted(task.status);

  const updatedTask = await Task.findOneAndUpdate(
    { _id: id },
    { $pull: { [subResource]: subResourceId } },
    { new: true }
  );

  return updatedTask.populate(populates) as unknown as TaskWithPopulatedUsers;
};
