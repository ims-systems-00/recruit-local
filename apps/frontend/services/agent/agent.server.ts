'use server';
import { AxiosError } from 'axios';
import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';

import {
  accessibilityPreferencesSchema,
  agentConversationCreateSchema,
  speechSchema,
} from './agent.validation';
import { ApiResponse } from '@/types/api';
import {
  AccessibilityPreferences,
  AccessibilityPreferencesInput,
  AccessibilityPreferencesResponse,
  AgentConversationInput,
  AgentData,
  AgentResponse,
  SpeechData,
  SpeechInput,
} from './agent.type';

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

export async function getAccessibilityPreferences(): Promise<
  ApiResponse<AccessibilityPreferences>
> {
  try {
    const res =
      await axiosServer.get<AccessibilityPreferencesResponse>(
        '/agent/preferences',
      );

    return {
      success: true,
      data: res.data.preferences,
      message: res.data.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to load assistant settings');
  }
}

export async function updateAccessibilityPreferences(
  payload: AccessibilityPreferencesInput,
): Promise<ApiResponse<AccessibilityPreferences>> {
  try {
    const validatedData = await accessibilityPreferencesSchema.validate(
      payload,
      { abortEarly: false, stripUnknown: true },
    );

    const res = await axiosServer.patch<AccessibilityPreferencesResponse>(
      '/agent/preferences',
      validatedData,
    );

    return {
      success: true,
      data: res.data.preferences,
      message: res.data.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to save assistant settings');
  }
}

/**
 * Fetches read-aloud audio.
 *
 * Proxied through the server rather than called from the browser because the
 * access token lives in the server session and is never handed to client code.
 * The response is binary, so this overrides the instance's JSON defaults.
 */
export async function synthesizeSpeech(
  payload: SpeechInput,
): Promise<ApiResponse<SpeechData>> {
  try {
    const validatedData = await speechSchema.validate(payload, {
      abortEarly: false,
      stripUnknown: true,
    });

    const res = await axiosServer.post<ArrayBuffer>(
      '/agent/speech',
      validatedData,
      { responseType: 'arraybuffer', headers: { Accept: 'audio/mpeg' } },
    );

    return {
      success: true,
      data: {
        audioBase64: Buffer.from(res.data).toString('base64'),
        contentType: String(res.headers['content-type'] ?? 'audio/mpeg'),
      },
    };
  } catch (error) {
    // An arraybuffer response type also applies to error bodies, so the JSON
    // message has to be decoded before handleServerError can read it.
    if (
      error instanceof AxiosError &&
      error.response?.data instanceof ArrayBuffer
    ) {
      try {
        error.response.data = JSON.parse(
          Buffer.from(error.response.data).toString('utf8'),
        );
      } catch {
        // Not JSON; fall through to the generic message.
      }
    }
    return handleServerError(error, 'Failed to read the message aloud');
  }
}
