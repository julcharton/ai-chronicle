'use client';

import { useRef, useEffect, useCallback } from 'react';
import { MemoryEditorContainer } from '@/components/memory-editor-container';
import { useMemorySync } from './memory-sync-context';
import { debounce } from 'lodash';

interface SyncedEditorProps {
  memoryId: string;
  initialContent: string;
  initialTitle: string;
  isSyncEnabledGlobal?: boolean;
}

/**
 * Wrapper around MemoryEditorContainer that adds scroll synchronization
 */
export function SyncedEditor({
  memoryId,
  initialContent,
  initialTitle,
  isSyncEnabledGlobal,
}: SyncedEditorProps) {
  const {
    editorScrollRef,
    registerEditorScroll,
    isSyncEnabled,
    setIsSyncEnabled,
    highlightedEditorPosition,
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
        registerEditorScroll(scrollPosition, maxScroll);
      }
    }, 50),
    [registerEditorScroll],
  );

  // Set up scroll event listener
  useEffect(() => {
    const scrollElement = editorScrollRef.current;

    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);

      // Initial scroll position
      const maxScroll = scrollElement.scrollHeight - scrollElement.clientHeight;
      registerEditorScroll(scrollElement.scrollTop, maxScroll);

      return () => {
        scrollElement.removeEventListener('scroll', handleScroll);
        handleScroll.cancel();
      };
    }
  }, [handleScroll, registerEditorScroll]);

  // Effect to scroll to highlighted position
  useEffect(() => {
    if (
      isSyncEnabled &&
      highlightedEditorPosition !== null &&
      editorScrollRef.current
    ) {
      editorScrollRef.current.scrollTop = highlightedEditorPosition;
    }
  }, [highlightedEditorPosition, isSyncEnabled]);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden relative">
      {isSyncEnabled && (
        <div className="absolute right-2 top-2 z-10 rounded-md bg-primary/10 px-2 py-1 text-xs text-primary">
          Sync Active
        </div>
      )}

      <div ref={editorScrollRef} className="flex-1 overflow-auto">
        <MemoryEditorContainer
          memoryId={memoryId}
          initialContent={initialContent}
          initialTitle={initialTitle}
        />
      </div>
    </div>
  );
}
