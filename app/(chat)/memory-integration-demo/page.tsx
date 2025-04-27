'use client';

import { useState, useEffect } from 'react';
import { MemoryContainer } from '@/components/memory/memory-container';
import { v4 as uuidv4 } from 'uuid';

export default function MemoryIntegrationDemo() {
  const [isLoading, setIsLoading] = useState(true);
  const [memoryId, setMemoryId] = useState<string>('');
  const [chatId, setChatId] = useState<string>('');

  // Initialize demo IDs on first render
  useEffect(() => {
    setMemoryId(uuidv4());
    setChatId(uuidv4());
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-lg">Initializing memory demo...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">Memory + Chat Integration</h1>
        <p className="text-muted-foreground">
          Two-column layout with memory editor and chat components integrated
        </p>
        <div className="mt-2 text-xs text-muted-foreground">
          <span className="font-medium">Demo IDs:</span> Memory:{' '}
          {memoryId.substring(0, 8)}... | Chat: {chatId.substring(0, 8)}...
        </div>
      </div>

      <div className="flex-1">
        <MemoryContainer
          memoryId={memoryId}
          chatId={chatId}
          initialContent=""
          initialTitle="Demo Memory"
          userId="demo-user"
          visibility="private"
          isReadonly={false}
        />
      </div>
    </div>
  );
}
