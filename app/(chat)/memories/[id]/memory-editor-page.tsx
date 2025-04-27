'use client';

import { useEffect, useState } from 'react';
import { SyncedMemoryContainer } from '@/components/memory/synced-memory-container';
import { getChatForMemory } from '../actions';
import { v4 as uuidv4 } from 'uuid';

interface MemoryEditorPageProps {
  memoryId: string;
  initialContent: string;
  initialTitle: string;
  userId: string;
  isReadonly?: boolean;
}

export function MemoryEditorPage({
  memoryId,
  initialContent,
  initialTitle,
  userId,
  isReadonly = false,
}: MemoryEditorPageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [chatId, setChatId] = useState<string>('');

  // Fetch or create associated chat
  useEffect(() => {
    async function initializeChat() {
      try {
        // Get existing chat or create a new one
        const result = await getChatForMemory(memoryId);

        if ('error' in result) {
          console.error('Error initializing chat:', result.error);
          // If error, generate a temporary chat ID for demo purposes
          // In production, you'd handle this error differently
          setChatId(uuidv4());
        } else {
          setChatId(result.chatId);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        setIsLoading(false);
      }
    }

    if (memoryId) {
      initializeChat();
    }
  }, [memoryId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-6 w-48 bg-muted rounded mb-4" />
          <div className="h-4 w-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <SyncedMemoryContainer
      memoryId={memoryId}
      chatId={chatId}
      initialContent={initialContent}
      initialTitle={initialTitle}
      userId={userId}
      visibility="private"
      isReadonly={isReadonly}
    />
  );
}
