'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MemorySyncProvider } from '@/components/memory/memory-sync-context';
import { SyncedEditor } from '@/components/memory/synced-editor';
import { SyncedChat } from '@/components/memory/synced-chat';
import { ArrowDownWideNarrow } from 'lucide-react';

export default function MemorySyncDemo() {
  const [isLoading, setIsLoading] = useState(true);
  const [memoryId, setMemoryId] = useState<string>('');
  const [chatId, setChatId] = useState<string>('');
  const [isSyncEnabled, setIsSyncEnabled] = useState(true);

  // Initialize demo IDs on first render
  useEffect(() => {
    setMemoryId(uuidv4());
    setChatId(uuidv4());
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh]">
        <p className="text-lg">Initializing memory demo...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden">
      {/* Header with sync toggle */}
      <div className="border-b py-3 px-4 flex items-center justify-between shrink-0 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold">Synchronized Memory Demo</h1>
          <p className="text-sm text-muted-foreground">
            Scroll either panel to see synchronized scrolling in action
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center text-xs text-muted-foreground mr-2">
            <ArrowDownWideNarrow className="mr-1 h-4 w-4" />
            <span>Try scrolling both panels</span>
          </div>
          <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-md">
            <Label htmlFor="sync-toggle" className="text-sm whitespace-nowrap">
              Sync Scroll
            </Label>
            <Switch
              id="sync-toggle"
              checked={isSyncEnabled}
              onCheckedChange={setIsSyncEnabled}
            />
          </div>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 flex-1 overflow-hidden">
        {/* Left panel - Memory Editor (3/5 width) */}
        <div className="col-span-1 lg:col-span-3 border-r flex flex-col overflow-hidden">
          <div className="p-2 border-b bg-background/80 backdrop-blur-sm shrink-0">
            <h2 className="font-medium">Memory Editor</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <MemorySyncProvider>
              <SyncedEditor
                memoryId={memoryId}
                initialContent={getLongContent()}
                initialTitle="Memory Content"
                isSyncEnabledGlobal={isSyncEnabled}
              />
            </MemorySyncProvider>
          </div>
        </div>

        {/* Right panel - Chat (2/5 width) */}
        <div className="col-span-1 lg:col-span-2 flex flex-col overflow-hidden">
          <div className="p-2 border-b bg-background/80 backdrop-blur-sm shrink-0">
            <h2 className="font-medium">Memory Chat</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <MemorySyncProvider>
              <SyncedChat
                chatId={chatId}
                visibility="private"
                isReadonly={false}
                isSyncEnabledGlobal={isSyncEnabled}
              />
            </MemorySyncProvider>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to generate long content for testing scroll
function getLongContent() {
  const paragraphs = [
    'This is a demonstration of synchronized scrolling between the memory editor and chat panels.',
    "As you scroll this editor, you'll notice the chat panel scrolls to keep related content in view.",
    'Similarly, if you scroll the chat panel, this editor will adjust to maintain context.',
    'This feature is particularly useful when discussing specific sections of a memory in the chat.',
    'The system establishes mappings between editor positions and chat messages to maintain context.',
    'Visual indicators highlight which parts of the content are currently being synchronized.',
    'This approach ensures users always maintain context when reviewing memories and their related discussions.',
    'The synchronization is implemented with debounced scroll events to maintain performance.',
    "It's designed to feel natural and unintrusive while providing clear value to the user experience.",
  ];

  // Repeat paragraphs to create longer content
  const repeatedParagraphs = [];
  for (let i = 0; i < 10; i++) {
    repeatedParagraphs.push(
      ...paragraphs.map(
        (p, idx) => `Section ${i + 1}, Paragraph ${idx + 1}: ${p}`,
      ),
    );
  }

  return repeatedParagraphs.join('\n\n');
}
