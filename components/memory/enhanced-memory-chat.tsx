'use client';

import { useState, useCallback } from 'react';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import type { VisibilityType } from '@/components/visibility-selector';
import type { UIMessage } from 'ai';
import { debounce } from 'lodash';
import { MemoryChatHeader } from './memory-chat-header';
import { useChat } from '@ai-sdk/react';
import { generateUUID } from '@/lib/utils';
import useSWR from 'swr';
import { fetcher } from '@/lib/utils';
import type { Vote } from '@/lib/db/schema';
import { MemoryMessages } from './memory-messages';
import { MultimodalInput } from '@/components/multimodal-input';

/**
 * Interface for Memory Chat component props as specified in the PRD
 */
interface MemoryChatProps {
  chatId: string;
  visibility: VisibilityType;
  isReadonly?: boolean;
  memoryId?: string;
  onContentUpdate?: (newContent: string) => void; // Updates editor content
  initialMessages?: UIMessage[];
  title?: string;
  showHeader?: boolean;
}

/**
 * Enhanced memory-specific chat component that implements the MemoryChatProps interface
 * and provides improved guidance for memory capture with a specialized header
 */
export function EnhancedMemoryChat({
  chatId,
  visibility,
  isReadonly = false,
  memoryId,
  onContentUpdate,
  initialMessages = [],
  title = 'Memory Chat',
  showHeader = true,
}: MemoryChatProps) {
  const [selectedModel] = useState(DEFAULT_CHAT_MODEL);
  const [isGuidanceMode, setIsGuidanceMode] = useState(true);
  const [lastMessageContent, setLastMessageContent] = useState<string>('');
  const [attachments, setAttachments] = useState<Array<any>>([]);

  // Toggle guidance mode on/off
  const handleToggleGuidanceMode = () => {
    setIsGuidanceMode(!isGuidanceMode);
  };

  // Initialize chat state with AI SDK
  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    status,
    reload,
    stop,
    append,
  } = useChat({
    id: chatId,
    body: { id: chatId, selectedChatModel: selectedModel },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
  });

  // Fetch votes for messages
  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${chatId}` : null,
    fetcher,
  );

  // Debounced function to update memory content based on chat messages
  const updateMemoryContent = useCallback(
    debounce((content: string) => {
      if (onContentUpdate && content) {
        onContentUpdate(content);
      }
    }, 500),
    [onContentUpdate],
  );

  // Watch for changes in messages to update the editor content
  const handleMessagesChange = useCallback(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];

      // Only update if it's an assistant message and the content is new
      if (lastMessage.role === 'assistant' && lastMessage.content) {
        if (lastMessage.content !== lastMessageContent) {
          setLastMessageContent(lastMessage.content);

          // Extract relevant content that should be added to the memory document
          const contentToAdd = lastMessage.content;

          // Only update content if guidance mode is on
          if (isGuidanceMode) {
            updateMemoryContent(contentToAdd);
          }
        }
      }
    }
  }, [lastMessageContent, updateMemoryContent, isGuidanceMode, messages]);

  // Call the message change handler when messages update
  useCallback(() => {
    handleMessagesChange();
  }, [messages, handleMessagesChange])();

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {showHeader && (
        <MemoryChatHeader
          title={title}
          chatId={chatId}
          selectedModelId={selectedModel}
          selectedVisibilityType={visibility}
          isReadonly={isReadonly}
          isGuidanceMode={isGuidanceMode}
          onToggleGuidanceMode={handleToggleGuidanceMode}
        />
      )}

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-hidden">
          <MemoryMessages
            chatId={chatId}
            status={status}
            votes={votes}
            messages={messages}
            setMessages={setMessages}
            reload={reload}
            isReadonly={isReadonly}
            isGuidanceMode={isGuidanceMode}
          />
        </div>

        {!isReadonly && (
          <div className="p-2 sm:p-4 border-t">
            <MultimodalInput
              chatId={chatId}
              input={input}
              setInput={setInput}
              status={status}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              append={append}
              handleSubmit={handleSubmit}
              className="bg-background"
            />
          </div>
        )}
      </div>

      <DataStreamHandler id={chatId} />
    </div>
  );
}
