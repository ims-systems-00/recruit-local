export interface AgentResponse {
  message: string;
  statusCode: number;
  agent: {
    conversationId: string;
    answer: string;
    stoppedReason: string;
    steps: AgentStep[];
    usage: AgentUsage;
  };
}

export interface AgentStep {
  tool: string;
  input: {
    status: string;
  };
  ok: boolean;
  durationMs: number;
}

export interface AgentUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AgentData {
  conversationId: string;
  answer: string;
  stoppedReason: string;
  steps: AgentStep[];
  usage: AgentUsage;
}

export interface AgentConversationInput {
  instruction: string;
}
