'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  InfiniteData,
  QueryKey,
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AccessibilityPreferences,
  AccessibilityPreferencesInput,
  AgentConversationInput,
  AgentConversationListResponse,
  AgentData,
  SpeechData,
} from './agent.type';
import {
  createAgentConversation,
  createAgentConversationMessage,
  deleteAgentConversation,
  getAccessibilityPreferences,
  getAgentConversation,
  listAgentConversations,
  synthesizeSpeech,
  updateAccessibilityPreferences,
} from './agent.server';
import { experienceKeys } from '../experience/experience.client';
import { educationKeys } from '../education/education.client';
import { skillKeys } from '../skill/skill.client';
import { jobProfileKeys } from '../job-profile/job-profile.client';
import { applicationKeys } from '../application/application.client';
import { statusKeys } from '../status/status.client';
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
        queryClient.invalidateQueries({
          queryKey: agentKeys.conversations(),
        });
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
        // The list is ordered by last activity.
        queryClient.invalidateQueries({
          queryKey: agentKeys.conversations(),
        });
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

export const agentKeys = {
  all: ['agent'] as const,
  preferences: () => [...agentKeys.all, 'preferences'] as const,
  conversations: () => [...agentKeys.all, 'conversations'] as const,
  conversationList: (clientSearch: string) =>
    [...agentKeys.conversations(), 'list', clientSearch] as const,
  conversation: (id: string) =>
    [...agentKeys.conversations(), 'detail', id] as const,
};

/** The caller's past conversations, a cursor page at a time. */
export function useAgentConversations(clientSearch = '', enabled = true) {
  return useInfiniteQuery<
    AgentConversationListResponse,
    Error,
    InfiniteData<AgentConversationListResponse, string | undefined>,
    QueryKey,
    string | undefined
  >({
    queryKey: agentKeys.conversationList(clientSearch),
    queryFn: async ({ pageParam }) => {
      const response = await listAgentConversations({
        cursor: pageParam,
        clientSearch,
      });
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination?.hasNextPage
        ? (lastPage.pagination.nextCursor ?? undefined)
        : undefined,
    enabled,
  });
}

/**
 * Fetches one conversation's transcript on demand. Imperative rather than a
 * `useQuery`, because it is loaded once into the chat's local message state
 * and the chat owns it from there.
 */
export function useLoadAgentConversation() {
  const queryClient = useQueryClient();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const load = async (id: string) => {
    setLoadingId(id);
    try {
      const conversation = await queryClient.fetchQuery({
        queryKey: agentKeys.conversation(id),
        queryFn: async () => {
          const response = await getAgentConversation(id);
          if (!response.success) throw new Error(response.message);
          return response.data;
        },
        // Always fresh: the transcript grows every time the user replies.
        staleTime: 0,
      });
      return conversation;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to load conversation',
      );
      return null;
    } finally {
      setLoadingId(null);
    }
  };

  return { loadConversation: load, loadingId };
}

export function useDeleteAgentConversation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => deleteAgentConversation(id),
    onSuccess: (response) => {
      if (!response.success) {
        toast.error(response.message);
        return;
      }
      queryClient.invalidateQueries({ queryKey: agentKeys.conversations() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete conversation');
    },
  });

  return {
    deleteConversation: mutation.mutateAsync,
    deletingId: mutation.isPending ? mutation.variables : null,
  };
}

/**
 * Query caches a completed Alice write makes stale, by tool name.
 *
 * Only steps that actually wrote count: a `pending` step is a proposal, and
 * refetching on a proposal would show the user a profile that has not changed.
 * `jobProfileKeys` is included for every write because completion percentages
 * are recomputed from these rows.
 */
const STALE_KEYS_BY_TOOL: Record<string, readonly (readonly string[])[]> = {
  add_experience: [experienceKeys.all, jobProfileKeys.all],
  add_education: [educationKeys.all, jobProfileKeys.all],
  add_skills: [skillKeys.all, jobProfileKeys.all],
  update_my_profile: [jobProfileKeys.all],
  // Refetching the job profile is what lets an open onboarding step show the
  // selection Alice just saved.
  set_profile_catalog: [jobProfileKeys.all],
  // The board's columns are unchanged by a move — only which one each card sits
  // in, and the per-column counts, both of which come from the application
  // lists the kanban and list views read.
  move_applications: [applicationKeys.all],
  // A new column starts empty, so no application query is stale.
  create_pipeline_stage: [statusKeys.all],
};

export function useInvalidateAfterAgentRun() {
  const queryClient = useQueryClient();

  return (data: AgentData) => {
    const stale = new Map<string, readonly string[]>();

    for (const step of data.steps ?? []) {
      if (!step.ok || step.pending) continue;
      for (const key of STALE_KEYS_BY_TOOL[step.tool] ?? []) {
        stale.set(key.join('|'), key);
      }
    }

    stale.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
  };
}

export function useAccessibilityPreferences(enabled = true) {
  const query = useQuery({
    queryKey: agentKeys.preferences(),
    queryFn: async () => {
      const response = await getAccessibilityPreferences();
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Optimistic, because these are toggles: a switch that waits on the network
 * before moving reads as broken, and for someone using a screen reader the
 * state announced on toggle has to be the new one.
 */
export function useUpdateAccessibilityPreferences() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: AccessibilityPreferencesInput) =>
      updateAccessibilityPreferences(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: agentKeys.preferences() });
      const previous = queryClient.getQueryData<AccessibilityPreferences>(
        agentKeys.preferences(),
      );
      if (previous) {
        queryClient.setQueryData(agentKeys.preferences(), {
          ...previous,
          ...payload,
        });
      }
      return { previous };
    },
    onSuccess: (response, _payload, context) => {
      if (response.success) {
        queryClient.setQueryData(agentKeys.preferences(), response.data);
        return;
      }
      if (context?.previous) {
        queryClient.setQueryData(agentKeys.preferences(), context.previous);
      }
      toast.error(response.message);
    },
    onError: (error: Error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(agentKeys.preferences(), context.previous);
      }
      toast.error(error.message || 'Failed to save assistant settings');
    },
  });

  return {
    updatePreferences: mutation.mutate,
    isPending: mutation.isPending,
  };
}

/** Converts the server action's base64 payload into a playable object URL. */
const toObjectUrl = ({ audioBase64, contentType }: SpeechData): string => {
  const binary = atob(audioBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: contentType }));
};

/**
 * Read-aloud playback for chat messages.
 *
 * One message plays at a time: starting another stops the current one, and
 * pressing the playing message's button stops it. Audio is kept per message
 * id for the life of the chat, so replaying a sentence someone missed is
 * instant and free. Object URLs are revoked on unmount.
 */
export function useReadAloud() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlsRef = useRef<Map<string | number, string>>(new Map());
  const [playingId, setPlayingId] = useState<string | number | null>(null);
  const [loadingId, setLoadingId] = useState<string | number | null>(null);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlayingId(null);
  }, []);

  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      audioRef.current?.pause();
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const speak = useCallback(
    /**
     * `cacheVariant` should change whenever the server would render different
     * audio for the same text — today, the stored speech rate. Without it, a
     * user who slows the voice down keeps hearing the old recording.
     */
    async (id: string | number, text: string, cacheVariant = '') => {
      const cacheKey = `${id}:${cacheVariant}`;
      if (playingId === id) {
        stop();
        return;
      }
      stop();

      let url = urlsRef.current.get(cacheKey);

      if (!url) {
        setLoadingId(id);
        const response = await synthesizeSpeech({ text });
        setLoadingId((current) => (current === id ? null : current));

        if (!response.success) {
          toast.error(response.message);
          return;
        }
        url = toObjectUrl(response.data);
        urlsRef.current.set(cacheKey, url);
      }

      // No playbackRate here: the server renders at the user's stored speed,
      // and scaling again in the browser would apply it twice.
      const audio = new Audio(url);
      audio.onended = () =>
        setPlayingId((current) => (current === id ? null : current));
      audioRef.current = audio;
      setPlayingId(id);

      try {
        await audio.play();
      } catch {
        // Autoplay can be refused before the user has interacted with the page.
        // The button stays available, so they can start it themselves.
        setPlayingId(null);
      }
    },
    [playingId, stop],
  );

  return { speak, stop, playingId, loadingId };
}
