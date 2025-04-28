'use client';

import type { UIMessage } from 'ai';
import { MemoryMessage, MemoryThinkingMessage } from './memory-message';
import { useScrollToBottom } from '../use-scroll-to-bottom';
import { memo } from 'react';
import type { Vote } from '@/lib/db/schema';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';

interface MemoryMessagesProps {
  chatId: string;
  status: UseChatHelpers['status'];
  votes: Array<Vote> | undefined;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  isGuidanceMode?: boolean;
}

/**
 * Memory-specific messages container that displays all messages
 * in a memory chat, including AI guidance indicators
 */
function PureMemoryMessages({
  chatId,
  status,
  votes,
  messages,
  setMessages,
  reload,
  isReadonly,
  isGuidanceMode = true,
}: MemoryMessagesProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  // Display an initial greeting if there are no messages
  const showEmptyState = messages.length === 0;

  // Display the thinking indicator when waiting for AI response
  const showThinking =
    status === 'submitted' &&
    messages.length > 0 &&
    messages[messages.length - 1].role === 'user';

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col min-w-0 gap-6 w-full h-full overflow-y-auto pt-4 px-3"
    >
      {showEmptyState && (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
          <div className="mb-4">
            <div className="size-12 flex items-center rounded-full justify-center ring-1 mx-auto shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                </svg>
              </div>
            </div>
          </div>
          <h3 className="text-lg font-medium">Welcome to Memory Chat</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            I'm here to help you capture and document your memories. Share
            something you'd like to remember, and we'll create it together.
          </p>
        </div>
      )}

      {messages.map((message, index) => (
        <MemoryMessage
          key={message.id}
          chatId={chatId}
          message={message}
          isLoading={status === 'streaming' && messages.length - 1 === index}
          vote={
            votes
              ? votes.find((vote) => vote.messageId === message.id)
              : undefined
          }
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isGuidanceMode={isGuidanceMode}
        />
      ))}

      {showThinking && (
        <MemoryThinkingMessage isGuidanceMode={isGuidanceMode} />
      )}

      <div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
      />
    </div>
  );
}

export const MemoryMessages = memo(
  PureMemoryMessages,
  (prevProps, nextProps) => {
    if (prevProps.status !== nextProps.status) return false;
    if (prevProps.isGuidanceMode !== nextProps.isGuidanceMode) return false;
    if (prevProps.messages.length !== nextProps.messages.length) return false;
    if (!equal(prevProps.messages, nextProps.messages)) return false;
    if (!equal(prevProps.votes, nextProps.votes)) return false;

    return true;
  },
);
