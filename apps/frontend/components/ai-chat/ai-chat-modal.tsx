'use client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  Bot,
  Check,
  Copy,
  Pencil,
  RefreshCw,
  Search,
  Send,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useCreateAgentConversation,
  useCreateAgentConversationMessage,
} from '@/services/agent/agent.client';
import { useSession } from 'next-auth/react';

type Message = {
  id: number;
  text: string;
  sender: 'alice' | 'user';
  time: string;
};

const initialMessages: Message[] = [
  {
    id: 1,
    sender: 'alice',
    text: "Hi there! I'm your recruitment assistant. How can I help you today?",
    time: '11:25',
  },
];

const now = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function BotAvatar({ variant = 'chat' }: { variant?: 'chat' | 'launcher' }) {
  const containerClasses =
    variant === 'launcher'
      ? 'w-14 h-14 border-[3px] border-white bg-bot-cyan'
      : 'w-[38px] h-[38px] border border-gray-200 bg-white max-sm:w-8 max-sm:h-8';
  return (
    <div
      className={`relative grid place-items-center shrink-0 rounded-full text-bot-dark ${containerClasses}`}
      aria-hidden="true"
    >
      <Bot
        size={18}
        strokeWidth={1.8}
        className="relative z-10 w-6 h-6 p-[3px] rounded-md text-[#122136] bg-bot-cyan max-sm:w-5 max-sm:h-5"
      />
      <span className="absolute top-[5px] left-[18px] w-[2px] h-[5px] bg-bot-dark" />
      <span className="absolute top-[2px] left-[16px] w-1 h-1 rounded-full bg-bot-dark" />
    </div>
  );
}

function AiChatModal({ setIsOpen }: { setIsOpen: (isOpen: boolean) => void }) {
  const { data: session } = useSession();
  const isLoggedIn = session?.user?.email ? true : false;
  const [conversationId, setConversationId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>(initialMessages);

  const { createAgentConversation, isPending: isCreatingConversation } =
    useCreateAgentConversation();

  const { createAgentConversationMessage, isPending: isSendingMessage } =
    useCreateAgentConversationMessage();

  const isTyping = isCreatingConversation || isSendingMessage;

  const [draft, setDraft] = useState('');
  const [attachment, setAttachment] = useState<string | null>('file name.pdf');
  const [searchOpen, setSearchOpen] = useState(false);
  // const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sendMessage = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    const text = draft.trim();

    if (!text || isTyping) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      text,
      time: now(),
    };

    setMessages((current) => [...current, userMessage]);
    setDraft('');
    setEditingId(null);

    if (!conversationId) {
      await createAgentConversation({
        payload: {
          instruction: text,
        },
        onSuccessCallback: (data) => {
          setConversationId(data.conversationId);

          setMessages((current) => [
            ...current,
            {
              id: Date.now() + 1,
              sender: 'alice',
              text: data.answer,
              time: now(),
            },
          ]);
        },
      });

      return;
    }

    await createAgentConversationMessage({
      conversationId,
      payload: {
        instruction: text,
      },
      onSuccessCallback: (data) => {
        setMessages((current) => [
          ...current,
          {
            id: Date.now() + 1,
            sender: 'alice',
            text: data.answer,
            time: now(),
          },
        ]);
      },
    });
  };
  const handleCopy = (message: Message) => {
    navigator.clipboard.writeText(message.text).then(() => {
      setCopiedId(message.id);
      setTimeout(
        () => setCopiedId((id) => (id === message.id ? null : id)),
        2000,
      );
    });
  };

  const handleEdit = (message: Message) => {
    setDraft(message.text);
    setEditingId(message.id);
    setMessages((current) => current.filter((m) => m.id !== message.id));
  };

  const handleResend = (message: Message) => {
    if (isTyping) return;
    if (message.sender === 'user') {
      setMessages((current) => current.filter((m) => m.id !== message.id));
      setMessages((current) => [
        ...current,
        { ...message, id: Date.now(), time: now() },
      ]);
      sendMessage();
    } else {
      setMessages((current) => current.filter((m) => m.id !== message.id));
      sendMessage();
    }
  };

  return (
    <>
      <section
        className="w-[min(380px,calc(100vw-32px))] h-[min(540px,calc(100vh-32px))] min-h-[420px] fixed right-spacing-md bottom-spacing-md z-30 flex flex-col overflow-hidden bg-white border border-gray-200 rounded-[18px] shadow-[0_18px_50px_rgba(28,42,61,0.22)] animate-rise max-sm:inset-0 max-sm:w-full max-sm:h-full max-sm:min-h-0 max-sm:rounded-none max-sm:border-0"
        aria-label="Alice recruitment assistant"
      >
        {/* Header */}
        <header className="min-h-[64px] flex items-center justify-between px-[18px] py-[14px] border-b border-gray-200 shrink-0 max-sm:min-h-[56px] max-sm:py-3 max-sm:px-[14px]">
          <div className="flex items-center gap-[11px]">
            <BotAvatar />
            <div>
              <h2 className="mb-[2px] text-base tracking-[0.03em] leading-[1.1]">
                ALICE
              </h2>
              <p className="text-[#556174] text-xs flex items-center">
                <span className="inline-block w-[7px] h-[7px] mr-[5px] rounded-full bg-green-500" />{' '}
                Active now
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className={`w-9 h-9 grid place-items-center text-[#101b2c] border-0 rounded-full bg-[#fafbfc] transition hover:bg-[#edf0f4] hover:-translate-y-[1px] max-sm:w-8 max-sm:h-8 ${searchOpen ? 'bg-[#edf0f4]' : ''}`}
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search conversation"
            >
              <Search size={18} />
            </button>
            <button
              className="w-9 h-9 grid place-items-center text-[#101b2c] border-0 rounded-full bg-[#fafbfc] transition hover:bg-[#edf0f4] hover:-translate-y-[1px] max-sm:w-8 max-sm:h-8"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Search bar */}
        {searchOpen && (
          <div className="flex items-center gap-[7px] px-[18px] py-2 border-b border-[#e6e8ec] text-[#647085]">
            <Search size={14} />
            <input
              className="w-full border-0 outline-none text-[#19253a] text-[13px]"
              autoFocus
              placeholder="Search conversation"
            />
          </div>
        )}

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto px-[18px] pt-[22px] pb-[16px] scrollbar-thin max-sm:px-3 max-sm:py-4"
          role="log"
          ref={messagesRef}
        >
          {messages.map((message) => {
            const isUser = message.sender === 'user';
            const isCopied = copiedId === message.id;
            return (
              <article
                className={`flex items-end gap-2.5 mb-[18px] max-sm:gap-2 max-sm:mb-[14px] ${isUser ? 'justify-end ml-[30px]' : ''}`}
                key={message.id}
              >
                {!isUser && <BotAvatar />}
                <div
                  className={isUser ? 'max-w-full' : 'max-w-[calc(100%-48px)]'}
                >
                  <div
                    className={cn(
                      'py-spacing-sm px-spacing-xs border border-border-gray-secondary rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-2xl',
                      isUser && 'rounded-br-none  bg-bg-gray-soft-primary',
                      !isUser && 'rounded-bl-none bg-bg-gray-soft-secondary',
                    )}
                  >
                    {/* <p className="m-0 text-label-sm text-text-gray-primary">
                      {message.text}
                    </p> */}
                    <div className="text-label-sm text-text-gray-primary">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => (
                            <p className="mb-2 last:mb-0">{children}</p>
                          ),

                          strong: ({ children }) => (
                            <strong className="font-semibold">
                              {children}
                            </strong>
                          ),

                          ul: ({ children }) => (
                            <ul className="my-2 ml-5 list-disc space-y-1">
                              {children}
                            </ul>
                          ),

                          ol: ({ children }) => (
                            <ol className="my-2 ml-5 list-decimal space-y-1">
                              {children}
                            </ol>
                          ),

                          li: ({ children }) => (
                            <li className="pl-1">{children}</li>
                          ),

                          a: ({ href, children }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline hover:text-blue-800"
                            >
                              {children}
                            </a>
                          ),

                          code: ({ children }) => (
                            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
                              {children}
                            </code>
                          ),
                        }}
                      >
                        {message.text}
                      </ReactMarkdown>

                      <time className="block mt-spacing-sm text-right text-label-xs font-label-xs-strong! text-text-gray-quaternary">
                        {message.time}
                      </time>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-1.5 px-1 text-fg-gray-secondary">
                    {/* <button
                      className="grid place-items-center p-0 border-0 bg-transparent transition hover:text-brand hover:-translate-y-[1px]"
                      aria-label="Share message"
                    >
                      <Share2 size={15} />
                    </button> */}
                    <button
                      className="grid place-items-center p-0 border-0 bg-transparent transition hover:text-brand hover:-translate-y-[1px]"
                      aria-label="Copy message"
                      onClick={() => handleCopy(message)}
                    >
                      {isCopied ? (
                        <Check size={14} className="text-online" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                    <button
                      className="grid place-items-center p-0 border-0 bg-transparent transition hover:text-brand hover:-translate-y-[1px]"
                      aria-label="Resend message"
                      onClick={() => handleResend(message)}
                    >
                      <RefreshCw size={14} />
                    </button>
                    {isUser && (
                      <button
                        className="grid place-items-center p-0 border-0 bg-transparent transition hover:text-brand hover:-translate-y-[1px]"
                        aria-label="Edit message"
                        onClick={() => handleEdit(message)}
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                  </div>
                  {isCopied && (
                    <span className="block text-right mt-0.5 text-[11px] font-semibold text-online">
                      Copied
                    </span>
                  )}
                </div>
              </article>
            );
          })}
          {isTyping && (
            <article className="flex items-center gap-2.5 mb-[18px]">
              <BotAvatar />
              <div className="flex items-center gap-[5px] px-4 py-3 border border-border-gray-secondary rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-none bg-bg-gray-soft-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-[#9aa5b6] animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#9aa5b6] animate-bounce [animation-delay:200ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#9aa5b6] animate-bounce [animation-delay:400ms]" />
              </div>
            </article>
          )}
        </div>

        {!isLoggedIn && (
          <div className="flex items-center mx-6 gap-2.5 mb-[18px] justify-center p-4 bg-[#fefce8] rounded-lg">
            <span className="text-label-sm text-[#894b00]">
              Please login to continue
            </span>
          </div>
        )}

        {/* Composer */}
        <form
          className="px-4 pt-[14px] pb-4 border-t border-[#e0e3e8] shrink-0 max-sm:p-3"
          onSubmit={sendMessage}
        >
          <div className="min-h-[96px] flex flex-col justify-between p-2 px-3 border-[1.5px] border-[#d9dde5] rounded-xl max-sm:min-h-[80px]">
            {/* {attachment && (
              <div className="w-fit max-w-full flex items-center gap-1.5 px-2 pt-1 pb-1 pl-[7px] text-[#3a485e] border-[1.5px] border-[#d8dde5] rounded-[20px] text-[11px]">
                <FileText size={15} />
                <strong className="text-[9px]">PDF</strong>
                <span className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[140px]">
                  {attachment}
                </span>
                <button
                  className="grid place-items-center pl-[5px] text-[#718095] border-0 bg-transparent"
                  type="button"
                  onClick={() => setAttachment(null)}
                  aria-label="Remove attachment"
                >
                  <X size={13} />
                </button>
              </div>
            )} */}
            <input
              className="w-full py-[5px] border-0 outline-none text-[#19253a] text-sm placeholder:text-[#758096]"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={!isLoggedIn}
              placeholder={
                editingId !== null ? 'Edit your message...' : 'Ask Alice...'
              }
              aria-label="Message Alice"
            />
            <div className="flex items-center gap-3.5">
              {/* <label
                className="relative grid place-items-center text-[#22334b] border-0 bg-transparent"
                aria-label="Attach a file"
              >
                <Paperclip size={18} />
                <input
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) =>
                    setAttachment(e.target.files?.[0]?.name ?? null)
                  }
                />
              </label>
              <button
                className="relative grid place-items-center text-[#22334b] border-0 bg-transparent"
                type="button"
                aria-label="Voice message"
              >
                <Mic size={18} />
              </button> */}
              <button
                className="w-[34px] h-[34px] grid place-items-center ml-auto text-white border-0 rounded-lg bg-bg-brand-solid-primary transition hover:bg-brand-dark hover:-translate-y-0.5"
                type="submit"
                aria-label="Send message"
                disabled={!isLoggedIn || isTyping}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </form>
      </section>
    </>
  );
}

export default AiChatModal;
