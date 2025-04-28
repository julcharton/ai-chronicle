'use client';

import { useState } from 'react';
import { TwoColumnLayout } from '@/components/layout/two-column-layout';
import { v4 as uuidv4 } from 'uuid';
import type { UIMessage } from 'ai';
import { EnhancedMemoryChat } from '@/components/memory/enhanced-memory-chat';
import { VisibilitySelector } from '@/components/visibility-selector';

/**
 * Demo page showcasing the Enhanced Memory Chat interface
 * including AI visual indicators, custom styling, and guidance mode
 */
export default function EnhancedMemoryChatDemo() {
  const [chatId] = useState<string>(uuidv4());
  const [memoryContent, setMemoryContent] = useState<string>(
    '# My Memory\n\nThis is a demo memory that will be updated by the chat interface when you interact with it.\n\nTry asking questions or sharing a memory to see the AI guidance in action!',
  );
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');

  const handleContentUpdate = (newContent: string) => {
    setMemoryContent((prevContent) => {
      return `${prevContent}\n\n${newContent}`;
    });
  };

  // Initial welcome message from the AI guide
  const initialMessages: UIMessage[] = [
    {
      id: uuidv4(),
      content:
        "I'm your memory guide. I'll help you document your memories in rich detail. What memory would you like to capture today?",
      role: 'assistant',
      createdAt: new Date(),
      parts: [
        {
          type: 'text',
          text: "I'm your memory guide. I'll help you document your memories in rich detail. What memory would you like to capture today?",
        },
      ],
    },
  ];

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h1 className="text-xl font-bold">Enhanced Memory Chat Demo</h1>
        <div className="flex items-center gap-4">
          <VisibilitySelector
            chatId={chatId}
            selectedVisibilityType={visibility}
            onVisibilityChange={(type) =>
              setVisibility(type as 'public' | 'private')
            }
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <TwoColumnLayout>
          <TwoColumnLayout.Column>
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-auto p-4 font-serif">
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{
                    __html: memoryContent.replace(/\n/g, '<br/>'),
                  }}
                />
              </div>
              <div className="border-t p-2 text-xs text-muted-foreground">
                <p className="italic">
                  This content is updated automatically based on AI suggestions
                  when guidance mode is enabled.
                </p>
              </div>
            </div>
          </TwoColumnLayout.Column>

          <TwoColumnLayout.Column>
            <div className="flex flex-col h-full">
              <EnhancedMemoryChat
                chatId={chatId}
                visibility={visibility}
                onContentUpdate={handleContentUpdate}
                initialMessages={initialMessages}
                title="Memory Guide Chat"
              />
            </div>
          </TwoColumnLayout.Column>
        </TwoColumnLayout>
      </div>
    </div>
  );
}
