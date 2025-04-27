'use client';

import { useEffect, useCallback } from 'react';
import { MemoryChat } from './memory-chat';
import { useMemorySync } from './memory-sync-context';
import { debounce } from 'lodash';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { VisibilityType } from '@/components/visibility-selector';

interface SyncedChatProps {
  chatId: string;
  visibility: VisibilityType;
  isReadonly?: boolean;
  isSyncEnabledGlobal?: boolean;
}

/**
 * Wrapper around MemoryChat that adds scroll synchronization
 */
export function SyncedChat({
  chatId,
  visibility,
  isReadonly = false,
  isSyncEnabledGlobal,
}: SyncedChatProps) {
  const {
    chatScrollRef,
    registerChatScroll,
    isSyncEnabled,
    toggleSync,
    setIsSyncEnabled,
    highlightedChatId,
    addContentMapping,
  } = useMemorySync();

  // Use the global sync toggle if provided
  useEffect(() => {
    if (isSyncEnabledGlobal !== undefined && setIsSyncEnabled) {
      setIsSyncEnabled(isSyncEnabledGlobal);
    }
  }, [isSyncEnabledGlobal, setIsSyncEnabled]);

  // Create a debounced version of the scroll handler
  const handleScroll = useCallback(
    debounce((e: Event) => {
      const target = e.target as HTMLDivElement;

      if (target) {
        // Calculate scroll position and max scroll
        const scrollPosition = target.scrollTop;
        const maxScroll = target.scrollHeight - target.clientHeight;

        // Register the scroll with the sync context
        registerChatScroll(scrollPosition, maxScroll);
      }
    }, 50),
    [registerChatScroll],
  );

  // Set up scroll event listener
  useEffect(() => {
    const scrollElement = chatScrollRef.current;

    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);

      // Initial scroll position
      const maxScroll = scrollElement.scrollHeight - scrollElement.clientHeight;
      registerChatScroll(scrollElement.scrollTop, maxScroll);

      return () => {
        scrollElement.removeEventListener('scroll', handleScroll);
        handleScroll.cancel();
      };
    }
  }, [handleScroll, registerChatScroll]);

  // Example mapping - in a real implementation, you would map based on content analysis
  useEffect(() => {
    const simulateMappingCreation = () => {
      // This is a simplified example - in a real implementation, you would:
      // 1. Analyze editor content (e.g., paragraphs, sections)
      // 2. Analyze chat messages that relate to those sections
      // 3. Create mappings between them

      // For demo purposes, we'll create some sample mappings after 1 second
      const editorPositions = [100, 300, 600, 900, 1200];

      // Simulate having message IDs (these would normally come from actual messages)
      const messageIds = ['msg1', 'msg2', 'msg3', 'msg4', 'msg5'];

      editorPositions.forEach((pos, index) => {
        if (index < messageIds.length) {
          addContentMapping(pos, messageIds[index]);
        }
      });
    };

    // Wait for content to load before creating mappings
    const timer = setTimeout(simulateMappingCreation, 1000);

    return () => clearTimeout(timer);
  }, [addContentMapping]);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {isSyncEnabledGlobal === undefined && (
        <div className="flex items-center justify-between p-2 border-b shrink-0">
          <h2 className="text-lg font-medium">Memory Chat</h2>
          <div className="flex items-center gap-2">
            <Label
              htmlFor="sync-switch"
              className="text-xs text-muted-foreground mr-1"
            >
              Sync Scroll
            </Label>
            <Switch
              id="sync-switch"
              checked={isSyncEnabled}
              onCheckedChange={toggleSync}
            />
          </div>
        </div>
      )}

      <div ref={chatScrollRef} className="flex-1 overflow-auto relative">
        <MemoryChat
          chatId={chatId}
          visibility={visibility}
          isReadonly={isReadonly}
        />

        {/* Highlight effect for the currently synced message */}
        {isSyncEnabled && highlightedChatId && (
          <div
            data-highlighted-id={highlightedChatId}
            className="pointer-events-none absolute inset-0 z-10"
          >
            {/* The actual highlighting would be applied via CSS that targets 
                the message with the matching ID */}
            <div className="absolute top-2 left-2 bg-primary/10 rounded-md px-2 py-1 text-xs text-primary">
              Synced Content
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
