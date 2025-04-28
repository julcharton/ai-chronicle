'use client';

import { TwoColumnLayout } from '@/components/layout/two-column-layout';
import { MemorySyncProvider } from './memory-sync-context';
import { SyncedEditor } from './synced-editor';
import { SyncedChat } from './synced-chat';
import type { VisibilityType } from '@/components/visibility-selector';

interface SyncedMemoryContainerProps {
  memoryId: string;
  chatId: string;
  initialContent: string;
  initialTitle: string;
  userId: string;
  visibility: VisibilityType;
  isReadonly?: boolean;
}

/**
 * Container component that integrates synced MemoryEditor and MemoryChat
 * with scroll synchronization capabilities
 */
export function SyncedMemoryContainer({
  memoryId,
  chatId,
  initialContent,
  initialTitle,
  userId,
  visibility,
  isReadonly = false,
}: SyncedMemoryContainerProps) {
  return (
    <div className="h-full w-full overflow-hidden">
      <MemorySyncProvider>
        <TwoColumnLayout
          leftContent={
            <SyncedEditor
              memoryId={memoryId}
              initialContent={initialContent}
              initialTitle={initialTitle}
            />
          }
          rightContent={
            <SyncedChat
              chatId={chatId}
              visibility={visibility}
              isReadonly={isReadonly}
            />
          }
        />
      </MemorySyncProvider>
    </div>
  );
}
