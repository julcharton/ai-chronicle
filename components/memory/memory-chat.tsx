'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { Chat } from '@/components/chat';
import type { VisibilityType } from '@/components/visibility-selector';
import type { UIMessage } from 'ai';
import { debounce } from 'lodash';

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
}

/**
 * Memory-specific chat component that integrates with the memory system
 * and provides guidance for memory capture
 */
export function MemoryChat({
  chatId,
  visibility,
  isReadonly = false,
  memoryId,
  onContentUpdate,
  initialMessages = [],
  title = 'Memory Chat',
}: MemoryChatProps) {
  const [selectedModel] = useState(DEFAULT_CHAT_MODEL);
  const [lastMessageContent, setLastMessageContent] = useState<string>('');

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
  const handleMessagesChange = useCallback(
    (messages: UIMessage[]) => {
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];

        // Only update if it's an assistant message and the content is new
        if (lastMessage.role === 'assistant' && lastMessage.content) {
          if (lastMessage.content !== lastMessageContent) {
            setLastMessageContent(lastMessage.content);

            // Extract relevant content that should be added to the memory document
            const contentToAdd = lastMessage.content;
            updateMemoryContent(contentToAdd);
          }
        }
      }
    },
    [lastMessageContent, updateMemoryContent],
  );

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <Chat
          key={chatId}
          id={chatId}
          initialMessages={initialMessages}
          selectedChatModel={selectedModel}
          selectedVisibilityType={visibility}
          isReadonly={isReadonly}
          onMessagesChange={handleMessagesChange}
        />
        <DataStreamHandler id={chatId} />
      </div>
    </div>
  );
}
