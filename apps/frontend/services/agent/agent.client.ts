'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AgentConversationInput, AgentData } from './agent.type';
import {
  createAgentConversation,
  createAgentConversationMessage,
} from './agent.server';
// Hook to create a new experience

export function useCreateAgentConversation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: AgentConversationInput) =>
      createAgentConversation(payload),
  });

  const createAgentConversationAsync = async ({
    payload,
    onSuccessCallback,
  }: {
    payload: AgentConversationInput;
    onSuccessCallback?: (data: AgentData) => void;
  }) => {
    try {
      const response = await mutation.mutateAsync(payload);

      if (response.success) {
        // toast.success(
        //   response.message || 'Agent conversation created successfully',
        // );
        // queryClient.invalidateQueries({ queryKey: experienceKeys.all });
        onSuccessCallback?.(response.data as AgentData);
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create agent conversation');
    }
  };

  return {
    createAgentConversation: createAgentConversationAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

export function useCreateAgentConversationMessage() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      conversationId,
      payload,
    }: {
      conversationId: string;
      payload: AgentConversationInput;
    }) => createAgentConversationMessage(conversationId, payload),
  });

  const createAgentConversationMessageAsync = async ({
    conversationId,
    payload,
    onSuccessCallback,
  }: {
    conversationId: string;
    payload: AgentConversationInput;
    onSuccessCallback?: (data: AgentData) => void;
  }) => {
    try {
      const response = await mutation.mutateAsync({ conversationId, payload });

      if (response.success) {
        // toast.success(
        //   response.message || 'Agent conversation message created successfully',
        // );
        // queryClient.invalidateQueries({ queryKey: experienceKeys.all });
        onSuccessCallback?.(response.data as AgentData);
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(
        error.message || 'Failed to create agent conversation message',
      );
    }
  };

  return {
    createAgentConversationMessage: createAgentConversationMessageAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
