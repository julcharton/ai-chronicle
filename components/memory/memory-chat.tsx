'use client';

import { useState } from 'react';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { Chat } from '@/components/chat';
import type { VisibilityType } from '@/components/visibility-selector';

interface MemoryChatProps {
  chatId: string;
  visibility: VisibilityType;
  isReadonly?: boolean;
}

/**
 * Memory-specific chat component that integrates with the memory system
 */
export function MemoryChat({
  chatId,
  visibility,
  isReadonly = false,
}: MemoryChatProps) {
  const [selectedModel] = useState(DEFAULT_CHAT_MODEL);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <Chat
          key={chatId}
          id={chatId}
          initialMessages={[]}
          selectedChatModel={selectedModel}
          selectedVisibilityType={visibility}
          isReadonly={isReadonly}
        />
        <DataStreamHandler id={chatId} />
      </div>
    </div>
  );
}
