'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { MemoryEditor } from './memory-editor';
import { updateMemoryAction } from '@/app/(chat)/memories/[id]/actions';
import {
  createMemoryEditorHandler,
  extractMetadataFromContent,
  validateMemoryContent,
} from '@/lib/editor/memory-editor-sync';
import { usePathname } from 'next/navigation';
import type { Suggestion } from '@/lib/db/schema';

export type MemoryEditorContainerProps = {
  memoryId: string;
  initialContent: string;
  initialTitle: string;
};

export function MemoryEditorContainer({
  memoryId,
  initialContent,
  initialTitle,
}: MemoryEditorContainerProps) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const pathname = usePathname();

  // Reference to track if we're currently updating from remote source
  const isUpdatingRef = useRef(false);

  // Auto-save handler for memory content
  const handleContentChange = useCallback(
    async (id: string, updatedContent: string, debounced: boolean) => {
      // Prevent saving if we're updating from a remote source
      if (isUpdatingRef.current) return;

      const validContent = validateMemoryContent(updatedContent);

      // Skip saving if content is empty or unchanged
      if (!validContent || validContent === content) return;

      // Update local state
      setContent(validContent);

      if (debounced) {
        setIsSaving(true);

        try {
          // Extract metadata from content
          const metadata = extractMetadataFromContent(validContent);

          // Update memory on the server
          const result = await updateMemoryAction({
            id,
            content: validContent,
            metadata,
          });

          if (result.success) {
            setLastSavedAt(new Date());
          } else {
            console.error(
              'Failed to save changes:',
              result.error || 'Please try again later',
            );
          }
        } catch (error) {
          console.error('Error saving memory:', error);
        } finally {
          setIsSaving(false);
        }
      }
    },
    [content],
  );

  // For image upload - would connect to a real image upload service
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    // This would be replaced with actual image upload functionality
    // For now, return a data URL as placeholder
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // In a real implementation, this would return the URL from the server
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  // Get the memory editor handler with the content change callback
  const { handleTransaction } = createMemoryEditorHandler({
    memoryId,
    onContentChange: handleContentChange,
    debounceDelay: 1000,
    debug: false,
  });

  // Function to handle AI assistance request
  const handleAIAssistance = useCallback(() => {
    console.log(
      'AI Assistance requested - will be implemented in a future update.',
    );
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center px-4 py-2 border-b">
        <h1 className="text-xl font-semibold truncate">{initialTitle}</h1>
        {isSaving ? (
          <span className="text-sm text-muted-foreground">Saving...</span>
        ) : lastSavedAt ? (
          <span className="text-sm text-muted-foreground">
            Saved {lastSavedAt.toLocaleTimeString()}
          </span>
        ) : null}
      </div>

      <div className="flex-1">
        <MemoryEditor
          memoryId={memoryId}
          content={content}
          onSaveContent={(updatedContent, debounce) => {
            handleContentChange(memoryId, updatedContent, debounce);
          }}
          onImageUpload={handleImageUpload}
          onAIAssistanceRequest={handleAIAssistance}
          status="idle"
          isCurrentVersion={true}
          currentVersionIndex={0}
          suggestions={[]}
        />
      </div>
    </div>
  );
}
