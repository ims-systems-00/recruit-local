import OpenAI from "openai";
import { ISession } from "@rl/types";
import { AgentTool } from "./tool.types";
import { listJobsTool } from "./list-jobs.tool";
import { getMyProfileTool } from "./get-my-profile.tool";
import { listApplicationsTool } from "./list-applications.tool";
import { getApplicationTool } from "./get-application.tool";

export * from "./tool.types";

/**
 * Every agent capability. Adding one is: implement AgentTool, add it here.
 */
const registry: AgentTool[] = [listJobsTool, getMyProfileTool, listApplicationsTool, getApplicationTool];

export const toolsFor = (session: ISession): AgentTool[] =>
  registry.filter((tool) => (tool.isAvailable ? tool.isAvailable(session) : true));

export const toolDefinitionsFor = (session: ISession): OpenAI.Chat.Completions.ChatCompletionFunctionTool[] =>
  toolsFor(session).map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));

/**
 * Session-scoped on purpose. Looking the tool up in the unfiltered registry
 * would let a model that hallucinated a name reach a tool it was never shown.
 */
export const findTool = (session: ISession, name: string): AgentTool | undefined =>
  toolsFor(session).find((tool) => tool.name === name);
