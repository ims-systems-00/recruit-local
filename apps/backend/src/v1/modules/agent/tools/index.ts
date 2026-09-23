import OpenAI from "openai";
import { ISession } from "@rl/types";
import { AgentTool } from "./tool.types";
import { listJobsTool } from "./list-jobs.tool";
import { getJobTool } from "./get-job.tool";
import { getMyProfileTool } from "./get-my-profile.tool";
import { listApplicationsTool } from "./list-applications.tool";
import { getApplicationTool } from "./get-application.tool";
import { recommendJobsTool } from "./recommend-jobs.tool";
import { analyzeMyProfileTool } from "./analyze-my-profile.tool";
import { analyzeJobFitTool } from "./analyze-job-fit.tool";
import { searchHelpTool } from "./search-help.tool";
import { getSetupProgressTool } from "./get-setup-progress.tool";
import { addExperienceTool } from "./add-experience.tool";
import { addEducationTool } from "./add-education.tool";
import { addSkillsTool } from "./add-skills.tool";
import { updateMyProfileTool } from "./update-my-profile.tool";
import { setAccessibilityTool } from "./set-accessibility.tool";
import { searchCatalogTool } from "./search-catalog.tool";
import { setProfileCatalogTool } from "./set-profile-catalog.tool";
import { listPipelineStagesTool } from "./list-pipeline-stages.tool";
import { moveApplicationsTool } from "./move-applications.tool";
import { createPipelineStageTool } from "./create-pipeline-stage.tool";

export * from "./tool.types";

/**
 * Every agent capability. Adding one is: implement AgentTool, add it here.
 */
const registry: AgentTool[] = [
  listJobsTool,
  getJobTool,
  getMyProfileTool,
  listApplicationsTool,
  getApplicationTool,
  recommendJobsTool,
  analyzeMyProfileTool,
  analyzeJobFitTool,
  searchHelpTool,
  getSetupProgressTool,
  addExperienceTool,
  addEducationTool,
  addSkillsTool,
  updateMyProfileTool,
  setAccessibilityTool,
  searchCatalogTool,
  setProfileCatalogTool,
  listPipelineStagesTool,
  moveApplicationsTool,
  createPipelineStageTool,
];

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
