'use client';

import { useEffect } from 'react';
import { MemoryEditorContainer } from '@/components/memory-editor-container';
import { TwoColumnLayout } from '@/components/layout/two-column-layout';
import { useRouter } from 'next/navigation';
import { MemoryChat } from './memory-chat';
import type { VisibilityType } from '@/components/visibility-selector';

interface MemoryContainerProps {
  memoryId: string;
  chatId: string;
  initialContent: string;
  initialTitle: string;
  userId: string;
  visibility: VisibilityType;
  isReadonly?: boolean;
}

/**
 * Container component that integrates MemoryEditor and MemoryChat in a two-column layout
 */
export function MemoryContainer({
  memoryId,
  chatId,
  initialContent,
  initialTitle,
  userId,
  visibility,
  isReadonly = false,
}: MemoryContainerProps) {
  const router = useRouter();

  // Prefetch the memory page for faster navigation
  useEffect(() => {
    if (chatId) {
      router.prefetch(`/memories/${memoryId}`);
    }
  }, [chatId, memoryId, router]);

  return (
    <TwoColumnLayout
      leftColumnTitle="Memory Editor"
      rightColumnTitle="Memory Chat"
      leftContent={
        <MemoryEditorContainer
          memoryId={memoryId}
          initialContent={initialContent}
          initialTitle={initialTitle}
        />
      }
      rightContent={
        <MemoryChat
          chatId={chatId}
          visibility={visibility}
          isReadonly={isReadonly}
        />
      }
    />
  );
}
