'use server';
import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';

import { agentConversationCreateSchema } from './agent.validation';
import { ApiResponse } from '@/types/api';
import { AgentConversationInput, AgentData, AgentResponse } from './agent.type';

const API_ENDPOINT = '/agent/conversations';

export async function createAgentConversation(
  payload: AgentConversationInput,
): Promise<ApiResponse<AgentData>> {
  try {
    const validatedData = await agentConversationCreateSchema.validate(
      payload,
      {
        abortEarly: false,
      },
    );

    const res = await axiosServer.post<AgentResponse>(
      API_ENDPOINT,
      validatedData,
    );
    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.agent,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to create agent conversation');
  }
}

export async function createAgentConversationMessage(
  conversationId: string,
  payload: AgentConversationInput,
): Promise<ApiResponse<AgentData>> {
  try {
    const validatedData = await agentConversationCreateSchema.validate(
      payload,
      {
        abortEarly: false,
      },
    );

    const res = await axiosServer.post<AgentResponse>(
      `${API_ENDPOINT}/${conversationId}/messages`,
      validatedData,
    );
    const backendResponse = res.data;

    return {
      success: true,
      data: backendResponse.agent,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to create agent conversation');
  }
}
