import { ISession, AGENT_STOPPED_REASON, AgentStepDto, AgentUsageDto } from "@rl/types";
import { IServiceListParams, IServiceGetParams } from "../../../common/interface/service.interface";
import { AgentConversationInput, IAgentConversationDoc } from "../../../models/agent-conversation.model";

export type IListAgentConversationParams = IServiceListParams<AgentConversationInput>;
export type IAgentConversationGetParams = IServiceGetParams<AgentConversationInput>;

export interface ICreateConversationParams {
  session: ISession;
  title: string;
}

export interface IAgentRunParams {
  conversation: IAgentConversationDoc;
  instruction: string;
  session: ISession;
}

export interface IAgentRunResult {
  answer: string;
  stoppedReason: AGENT_STOPPED_REASON;
  steps: AgentStepDto[];
  usage?: AgentUsageDto;
}
