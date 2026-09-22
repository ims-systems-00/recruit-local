'use client';
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, MessageSquare, Plus, Search, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useAgentConversations,
  useDeleteAgentConversation,
} from '@/services/agent/agent.client';

/** Waits for typing to pause before searching, so each keystroke isn't a request. */
function useDebounced<T>(value: T, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

/**
 * The user's past conversations with Alice. Takes the place of the message
 * list while open; picking one hands its id back to the chat to load.
 */
function AiChatHistory({
  activeConversationId,
  loadingId,
  onSelect,
  onNewChat,
  onDeleted,
}: {
  activeConversationId: string | null;
  loadingId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDeleted: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const clientSearch = useDebounced(search.trim());

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAgentConversations(clientSearch);
  const { deleteConversation, deletingId } = useDeleteAgentConversation();

  const conversations = data?.pages.flatMap((page) => page.docs) ?? [];

  const handleDelete = async (id: string) => {
    // Failures are already toasted by the hook.
    const response = await deleteConversation(id).catch(() => null);
    if (response?.success) onDeleted(id);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center gap-2 px-[18px] py-2 border-b border-[#e6e8ec]">
        <div className="flex-1 flex items-center gap-[7px] text-[#647085]">
          <Search size={14} />
          <input
            className="w-full border-0 outline-none text-[#19253a] text-[13px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations"
            aria-label="Search conversations"
          />
        </div>
        <button
          type="button"
          className="flex items-center gap-1 shrink-0 px-2 py-1 text-label-xs font-semibold text-text-gray-primary border border-border-gray-secondary rounded-lg transition hover:bg-[#edf0f4]"
          onClick={onNewChat}
        >
          <Plus size={13} /> New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin">
        {isLoading && (
          <div className="grid place-items-center py-8 text-text-gray-quaternary">
            <Loader2 size={18} className="animate-spin" />
          </div>
        )}

        {isError && (
          <p className="px-3 py-6 text-center text-label-sm text-text-gray-quaternary">
            {error?.message || 'Could not load conversations.'}
          </p>
        )}

        {!isLoading && !isError && conversations.length === 0 && (
          <p className="px-3 py-6 text-center text-label-sm text-text-gray-quaternary">
            {clientSearch
              ? 'No conversations match your search.'
              : 'No past conversations yet.'}
          </p>
        )}

        <ul>
          {conversations.map((conversation) => {
            const id = String(conversation._id ?? conversation.id);
            const isActive = id === activeConversationId;
            const isLoadingThis = loadingId === id;
            const isDeleting = deletingId === id;
            const lastActive =
              conversation.lastMessageAt ?? conversation.createdAt;

            return (
              <li key={id} className="group relative">
                <button
                  type="button"
                  className={cn(
                    'w-full flex items-start gap-2.5 px-3 py-2.5 pr-9 text-left rounded-lg transition hover:bg-[#f3f5f8] disabled:opacity-60',
                    isActive && 'bg-[#edf0f4]',
                  )}
                  onClick={() => onSelect(id)}
                  disabled={isLoadingThis || isDeleting}
                  aria-current={isActive ? 'true' : undefined}
                >
                  {isLoadingThis ? (
                    <Loader2
                      size={15}
                      className="mt-0.5 shrink-0 animate-spin text-fg-gray-secondary"
                    />
                  ) : (
                    <MessageSquare
                      size={15}
                      className="mt-0.5 shrink-0 text-fg-gray-secondary"
                    />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-label-sm font-semibold text-text-gray-primary">
                      {conversation.title || 'Untitled conversation'}
                    </span>
                    {lastActive && (
                      <span className="block text-label-xs text-text-gray-quaternary">
                        {formatDistanceToNow(new Date(lastActive), {
                          addSuffix: true,
                        })}
                      </span>
                    )}
                  </span>
                </button>
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-7 h-7 rounded-md text-fg-gray-secondary opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100 hover:bg-[#e3e7ed] hover:text-red-600 disabled:opacity-60"
                  onClick={() => handleDelete(id)}
                  disabled={isDeleting}
                  aria-label={`Delete conversation: ${conversation.title || 'Untitled'}`}
                >
                  {isDeleting ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {hasNextPage && (
          <button
            type="button"
            className="w-full mt-1 py-2 text-label-xs font-semibold text-text-gray-quaternary rounded-lg transition hover:bg-[#f3f5f8] disabled:opacity-60"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Loading…' : 'Load more'}
          </button>
        )}
      </div>
    </div>
  );
}

export default AiChatHistory;
