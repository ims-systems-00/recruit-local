import { Email } from "./core";

interface TaskAssignedPayload {
  assignerName: string;
  reference: string;
  taskLink: string;
  taskTitle: string;
}

export class TaskAssignedEmail extends Email {
  constructor(payload: TaskAssignedPayload) {
    super({
      template: "task-assigned",
      subject: "[Task] Task assigned to you",
      payload,
    });
  }
}
